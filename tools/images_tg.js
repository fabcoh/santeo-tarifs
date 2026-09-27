#!/usr/bin/env node
/* Images des sélections SANS TARIF, pour le CRM — docs/tg/*.png et docs/tg/index.json.
 *
 *   node tools/images_tg.js             fabrique les images si elles ne sont plus à jour
 *   node tools/images_tg.js --verifier  code 0 si à jour, 1 sinon (sans navigateur)
 *
 * Le choix des formules vient de src/selections.js, le tableau de src/tableau.js et
 * src/tableau.css : ce sont les mêmes fichiers que le comparateur, l'image ne peut
 * pas dire autre chose que lui. L'empreinte (index.json → « empreinte ») couvre tout
 * ce qui se voit sur les images : si elle ne change pas, rien n'est refait, et le
 * CRM sait qu'une image a changé en comparant cette empreinte.
 *
 * Les logos sont intégrés en data: (aucun chargement distant) ; les polices viennent
 * de Google Fonts, comme dans la page. La ligne du besoin est mise en avant, comme
 * le fait un clic sur son libellé dans le comparateur.
 */
"use strict";
const fs=require("fs"), path=require("path"), crypto=require("crypto");

const RACINE=path.resolve(__dirname,"..");
const SORTIE=path.join(RACINE,"docs","tg");
const ADRESSE="https://fabcoh.github.io/santeo-tarifs/docs/tg/";
const lire=f=>fs.readFileSync(path.join(RACINE,f));

const G=JSON.parse(lire("src/garanties.json"));
const T=require(path.join(RACINE,"src/tableau.js"));
const S=require(path.join(RACINE,"src/selections.js"));
const CSS=lire("src/tableau.css").toString("utf8");
const LOGOS=fs.readdirSync(path.join(RACINE,"docs")).filter(f=>/^logo_[a-z]+\.png$/.test(f)).sort();

const sels=S.selections(G);

// Tout ce qui se voit sur une image : les valeurs de chaque ligne, les noms, les limites.
function contenu(sel){
  return sel.formules.map(c=>({key:c.key,fi:c.fi,nom:T.nomComplet(G,c.key,c.fi),
    compagnie:G.compagnies[c.key],logo:G.gammes[c.key].logo||G.gammes[c.key].ins,
    lignes:T.lignes(G,[c]).map(([lab,src])=>[lab,T.valeur(G,c.key,c.fi,src)]),
    limites:T.limites(G,c.key,c.fi)||""}));
}
const h=crypto.createHash("sha256");
h.update(JSON.stringify(sels.map(s=>[s.id,s.ligne,contenu(s)])));
for(const f of ["src/tableau.js","src/tableau.css","src/selections.js","tools/images_tg.js"]) h.update(lire(f));
for(const f of LOGOS) h.update(lire("docs/"+f));
const EMPREINTE=h.digest("hex").slice(0,16);

function aJour(){
  try{
    const idx=JSON.parse(fs.readFileSync(path.join(SORTIE,"index.json"),"utf8"));
    return idx.empreinte===EMPREINTE && idx.images.every(i=>fs.existsSync(path.join(SORTIE,i.fichier)));
  }catch(_){ return false; }
}

if(process.argv.includes("--verifier")){
  console.log(aJour()?"Images à jour ("+EMPREINTE+").":"Images à refaire ("+EMPREINTE+").");
  process.exit(aJour()?0:1);
}
if(aJour()){ console.log("Images à jour ("+EMPREINTE+"), rien à refaire."); process.exit(0); }

function html(sel){
  const comp=[...new Set(sel.formules.map(c=>G.compagnies[c.key]))].join(" · ");
  let doc=T.document(G,{cols:sel.formules.map(c=>({key:c.key,fi:c.fi})),reco:null,tarifs:{},sansTarifs:true,
    sousTitre:comp,base:"LOGO/",css:CSS});
  doc=doc.replace(/src="LOGO\/(logo_[a-z]+\.png)"/g,(m,f)=>
    LOGOS.includes(f)?'src="data:image/png;base64,'+lire("docs/"+f).toString("base64")+'"':m);
  // La ligne du besoin, mise en avant comme dans le comparateur.
  doc=doc.replace('<tr><td>'+sel.ligne+'</td>','<tr class="avant"><td>'+sel.ligne+'</td>');
  // Ni étoile vide ni bouton : l'image ne conseille pas une formule plutôt qu'une autre.
  return doc.replace("</head>","<style>#tgbox .star{display:none}</style>\n</head>");
}

(async()=>{
  const {chromium}=require("playwright");
  const nav=await chromium.launch(process.env.CHROMIUM?{executablePath:process.env.CHROMIUM}:{});
  fs.mkdirSync(SORTIE,{recursive:true});
  const images=[];
  for(const sel of sels){
    if(!sel.formules.length) continue;
    const doc=html(sel);
    // Largeur mesurée à l'échelle 1, puis capture plafonnée à ~2000 px comme dans la page.
    let ctx=await nav.newContext({viewport:{width:2600,height:1400}});
    let p=await ctx.newPage(); await p.setContent(doc,{waitUntil:"networkidle"});
    await p.evaluate(()=>document.fonts.ready);
    const w=await p.evaluate(()=>{const b=document.getElementById("tgbox"),t=b.querySelector("table");
      b.style.width=(t.offsetWidth+40)+"px";return t.offsetWidth+40;});
    await ctx.close();
    const scale=Math.min(2,Math.max(1,2000/w));
    ctx=await nav.newContext({viewport:{width:2600,height:1400},deviceScaleFactor:scale});
    p=await ctx.newPage(); await p.setContent(doc,{waitUntil:"networkidle"});
    await p.evaluate(()=>document.fonts.ready);
    // Jamais d'image en police de secours : elle ne ressemblerait pas à celle du comparateur.
    const polices=await p.evaluate(()=>document.fonts.check("700 16px Archivo")&&document.fonts.check("400 16px 'IBM Plex Sans'"));
    if(!polices) throw new Error("Polices Archivo / IBM Plex Sans non chargées : images non produites.");
    await p.evaluate(()=>{const b=document.getElementById("tgbox"),t=b.querySelector("table");b.style.width=(t.offsetWidth+40)+"px";});
    const fichier=sel.id+".png";
    await (await p.$("#tgbox")).screenshot({path:path.join(SORTIE,fichier)});
    await ctx.close();
    // Un contrat non responsable n'est pas une alerte : Fabrice garde GCI 500 aux niveaux 4
    // (27/09/2026). Chaque formule porte « responsable », et les limites de l'image le disent.
    const alerte=sel.formules.length<3?"moins de 3 formules à ce niveau":undefined;
    images.push({id:sel.id,besoin:sel.besoin,niveau:sel.niveau,fichier:fichier,url:ADRESSE+fichier,
      ligneMiseEnAvant:sel.ligne,
      formules:sel.formules.map(c=>({key:c.key,fi:c.fi,compagnie:c.compagnie,logo:c.logo,gamme:c.gamme,
        formule:c.formule,nom:c.nom,valeur:c.valeur,responsable:c.responsable})),
      alerte:alerte});
    console.log(fichier.padEnd(22),sel.formules.map(c=>c.nom).join(" | "));
  }
  await nav.close();
  fs.writeFileSync(path.join(SORTIE,"index.json"),JSON.stringify({
    empreinte:EMPREINTE, genere:new Date().toISOString(),
    source:"Comparateur Santéo — src/selections.js sur src/garanties.json",
    niveaux:{"1":"100 % (ou un forfait en euros)","2":"au moins 131","3":"au moins 200","4":"au moins 300 — la formule la plus forte"},
    regle:"Colonne 1 : Cap Évolution Accès, toujours. Puis une compagnie par colonne, jamais deux fois le même logo, dans l'ordre MCCI (Flexia), Mutuelle Verte, Révoluo (REMA), APICIL (Équilibre) : la formule la moins chère qui atteint le niveau, la plus forte au niveau 4. Compagnie qui n'atteint pas le niveau : absente. 5 colonnes au plus.",
    images:images},null,1)+"\n");
  console.log("Empreinte "+EMPREINTE+" — "+images.length+" images dans docs/tg/.");
})().catch(e=>{console.error(e);process.exit(1);});
