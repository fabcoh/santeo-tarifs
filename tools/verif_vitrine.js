#!/usr/bin/env node
/* Essais de src/vitrine.js (mail « vitrine » du CRM Santéo) : 25, 40 et 60 ans à 75011, avec et sans étoiles.
 * Gammes locales : vrais tarifs (src/moteur.js + src/tarifs_all.json). APICIL et APRIL : PRIX FICTIFS (le relais
 * n'est pas joignable d'ici) — ils ne servent qu'à vérifier les règles de choix, pas un tarif.
 * Usage : node tools/verif_vitrine.js [--detail]   (code de sortie 1 si une règle est enfreinte) */
"use strict";
const path=require("path"), fs=require("fs");
const R=path.join(__dirname,"..");
const Moteur=require(path.join(R,"src/moteur.js")), Vitrine=require(path.join(R,"src/vitrine.js"));
const D=JSON.parse(fs.readFileSync(path.join(R,"src/tarifs_all.json"),"utf8"));
const G=JSON.parse(fs.readFileSync(path.join(R,"src/garanties.json"),"utf8"));
const detail=process.argv.includes("--detail");

const F=Object.assign({},G.gammes,{APRIL:Vitrine.garantiesApril(G)});
function aprilFictif(age){
  const A=G.april.gammes, produits=[];
  for(const code of Object.keys(A)){
    const g=A[code]; if(g.tns) continue;
    produits.push({code:code, idx:g.rang, nom:g.label.replace(/^APRIL /,""), resp:g.resp===true,
      niveaux:g.niv.map((n,i)=>({niv:n, prix:Math.round((35+age*0.9+i*22+g.rang)*100)/100}))});
  }
  return {etat:"ok", produits:produits};
}
function apicilFictif(age){
  const t={};
  Moteur.CODES_APICIL.forEach((c,i)=>{ if(i>=6&&age<=50) return; t[c]=Math.round((30+age*0.85+i*14)*100)/100; });
  return {profil:{codePostalAssure:"75011"}, etat:"ok", tarifs:t, cpExact:true};
}
function lignes(age,relais){
  const dept=Moteur.departement("75011");
  return Moteur.calculer({D, F, sel:{APRIL:true, APICIL:true, MCCINOVA:true, FLEXIA:true, SOLENCIA:true, CAPEVO:true,
      CAPNR:true, LPSH:true, REV:true, RF50:true, RF100:true, MV:true, TALIS:true},
    age, cnjAge:null, hasCnj:false, kids:0, reg:"SAL", dept, zone:Moteur.zones(D)[dept],
    apicil:relais?apicilFictif(age):{profil:{codePostalAssure:"75011"},etat:"erreur",message:"relais absent"},
    april:relais?aprilFictif(age):{etat:"erreur"}}).rows;
}

let fautes=0;
const faute=(cas,m)=>{fautes++;console.log("  ✗ "+cas+" : "+m)};
const CAS=[];
for(const age of [25,40,60]) for(const et of [null,{hosp:3,hono:2,dent:4,opt:3},{hosp:5,hono:5,dent:5,opt:5}])
  for(const relais of [true,false]) CAS.push({age,et,relais});

for(const c of CAS){
  const rows=lignes(c.age,c.relais);
  const v=Vitrine.choisir(rows,{age:c.age, etoiles:c.et, G, reg:"SAL"});
  const nom=c.age+" ans, "+(c.et?"étoiles "+JSON.stringify(c.et):"sans étoiles")+(c.relais?"":", relais APRIL/APICIL absents");
  console.log("● "+nom+" → "+v.offres.length+"/"+v.nb+" offres, cible "+JSON.stringify(v.cible));
  const attendu=c.age<=29?3:c.age<=50?6:9;
  if(v.nb!==attendu) faute(nom,"nb "+v.nb+" au lieu de "+attendu);
  const admis=rows.filter(r=>r.resp===true&&r.total>0);
  v.offres.forEach((o,i)=>{
    const r=rows.find(r=>r.key===o.key&&r.fi===o.fi);
    if(!r) faute(nom,o.nom+" absente des lignes du moteur");
    else if(Math.abs(r.total-o.prix)>0.005) faute(nom,o.nom+" prix "+o.prix+" ≠ moteur "+r.total);
    if(!(o.prix>0)) faute(nom,o.nom+" sans prix");
    if(["TALIS","LPSH"].includes(o.key)) faute(nom,o.nom+" exclue (TALIS / LPS)");
    if(r&&r.resp!==true) faute(nom,o.nom+" non responsable");
    if(o.key==="SOLENCIA") faute(nom,"SOLENCIA sans retraite connue");
    const cib=o.palier==="plus"?v.ciblePlus:v.cible;
    const sous=Vitrine.POSTES.filter(p=>o.etoiles[p.k]<v.cible[p.k]).map(p=>p.k);
    if(o.palier==="approche"){ if(sous.join()!==o.enDessous.join()||!sous.length) faute(nom,o.nom+" enDessous faux"); }
    else for(const p of Vitrine.POSTES) if(o.etoiles[p.k]<cib[p.k]) faute(nom,o.nom+" "+p.k+" "+o.etoiles[p.k]+"★ < "+cib[p.k]);
    if(o.palier!=="approche"&&v.offres.slice(0,i).some(x=>x.palier==="approche")) faute(nom,"offre « approche » avant une offre qui atteint la cible");
    if(!c.relais&&(o.key==="APRIL"||o.key==="APICIL")) faute(nom,o.nom+" choisie sans réponse du relais");
    if(i===0&&!o.reco) faute(nom,"1re offre non conseillée");
    if(i>0&&o.reco) faute(nom,"plusieurs offres conseillées");
    if(o.offert!==(o.ins==="avenir")) faute(nom,o.nom+" offert mal posé");
    if(!o.documents.length) faute(nom,o.nom+" sans document");
    if(detail||i<12) console.log("   "+(o.reco?"⭐":"  ")+" "+o.prix.toFixed(2).padStart(7)+" €  "+o.nom.padEnd(34)+" "+o.assureur.padEnd(18)
      +" H"+o.etoiles.hosp+" Ho"+o.etoiles.hono+" D"+o.etoiles.dent+" O"+o.etoiles.opt+(o.palier==="plus"?"  (+1 niveau)":o.palier==="approche"?"  (approche : "+o.enDessous.join(",")+")":"")+(o.offert?"  1 mois offert":""));
  });
  // Une compagnie par offre avant d'en répéter une.
  const vues=[]; let repete=false;
  for(const o of v.offres.filter(o=>o.palier==="base")){ if(vues.includes(o.ins)) repete=true; vues.push(o.ins); }
  const ciesPossibles=new Set(admis.filter(r=>!["TALIS","LPSH","SOLENCIA"].includes(r.key)).map(r=>r.ins)).size;
  // Une compagnie répétée alors qu'une autre compagnie avait une formule qui atteint la cible et n'est pas prise :
  const insPris=new Set(v.offres.map(o=>o.ins));
  if(repete){
    const autre=rows.some(r=>!insPris.has(r.ins)&&r.resp===true&&r.total>0&&!["TALIS","LPSH","SOLENCIA"].includes(r.key)
      &&!Vitrine.POSTES.some(p=>r[p.champ]==="n.c.")&&Vitrine.POSTES.every(p=>Vitrine.etoiles(r)[p.k]>=v.cible[p.k]));
    if(autre) faute(nom,"compagnie répétée alors qu'une autre était possible");
  }
  if(v.offres.filter(o=>o.reco).length>1) faute(nom,"plusieurs conseillées");
  const tetes=v.offres.filter((o,i)=>i>0&&o.ins==="avenir"&&o.palier==="base"&&o.prix<v.offres[0].prix&&v.offres[0].ins==="avenir");
  if(tetes.length) faute(nom,"une Avenir moins chère derrière la tête Avenir");
  if(v.offres.length&&v.offres[0].ins!=="avenir"&&!v.notes.length) faute(nom,"Avenir absente de la tête sans note");
  // Ordre : après la tête, prix croissant.
  for(let i=2;i<v.offres.length;i++) if(v.offres[i].palier===v.offres[i-1].palier&&v.offres[i].prix<v.offres[i-1].prix) faute(nom,"ordre des prix");
  v.notes.forEach(n=>console.log("   ⓘ "+n));
}
// --- Minimums en vraies valeurs (curseurs, 22/11/2026) ---------------------------------------------------
// Contrôle indépendant de la règle : 1er nombre, unité du poste ; optique 1 = Essentiel.
function tientRef(c,s,min){
  if(!min) return true; s=String(s==null?"":s);
  const m=s.replace(/\s/g,"").replace(",",".").match(/^(\d+(?:\.\d+)?)(%|€)/); if(!m) return false;
  const v=+m[1], u=m[2];
  if(c==="opt") return min<=1?v>0:(u==="€"&&v>=min);
  return u==="%"&&v>=min;
}
const CASMIN=[];
for(const age of [40,60]) for(const relais of [true,false]){
  CASMIN.push({age,relais,mins:{hospO:0,honoO:0,dent:200,opt:300}});
  CASMIN.push({age,relais,mins:{hospO:0,honoO:0,dent:0,opt:0}});
  CASMIN.push({age,relais,mins:{hospO:150,honoO:130,dent:200,opt:1}});
}
CASMIN.push({age:40,relais:true,mins:{hospO:400,honoO:400,dent:400,opt:400},vide:true});
for(const c of CASMIN){
  const rows=lignes(c.age,c.relais);
  const v=Vitrine.choisir(rows,{age:c.age, minimums:c.mins, G, reg:"SAL"});
  const nom=c.age+" ans, minimums "+JSON.stringify(c.mins)+(c.relais?"":", relais absents");
  console.log("● "+nom+" → "+v.offres.length+"/"+v.nb+" offres");
  const tousZero=Object.values(c.mins).every(x=>!x);
  const admis=rows.filter(r=>r.resp===true&&r.total>0&&!["TALIS","LPSH","SOLENCIA"].includes(r.key)&&!["hospO","honoO","dent","opt"].some(k=>r[k]==="n.c."));
  // Niveau d'office selon l'âge gardé (CRM Santeo, 22/11/2026) : les minimums s'y ajoutent.
  const passent=admis.filter(r=>["hospO","honoO","dent","opt"].every(k=>tientRef(k,r[k],c.mins[k]))
    &&Vitrine.POSTES.every(p=>Vitrine.etoiles(r)[p.k]>=v.cible[p.k]));
  if(!tousZero&&v.offres.length!==Math.min(v.nb,passent.length)) faute(nom,v.offres.length+" offres pour "+passent.length+" formules qui passent");
  if(c.vide&&(v.offres.length||!v.notes.length)) faute(nom,"aucune ne devait passer, avec une note");
  if(tousZero!==(v.minimums===null)) faute(nom,"minimums rendus à tort");
  if(tousZero){ const s=Vitrine.choisir(rows,{age:c.age,G,reg:"SAL"}); if(JSON.stringify(s.offres.map(o=>o.cle))!==JSON.stringify(v.offres.map(o=>o.cle))) faute(nom,"tout à 0 ≠ sans minimums"); }
  v.offres.forEach((o,i)=>{
    for(const k of ["hospO","honoO","dent","opt"]) if(!tientRef(k,o.valeurs[k],c.mins[k])) faute(nom,o.nom+" "+k+" « "+o.valeurs[k]+" » < "+c.mins[k]);
    if(o.palier==="approche"&&!tousZero) faute(nom,"palier approche en mode minimums");
    if(i===0&&!o.reco) faute(nom,"1re non conseillée");
    console.log("   "+(o.reco?"⭐":"  ")+" "+o.prix.toFixed(2).padStart(7)+" €  "+o.nom.padEnd(34)+" H "+String(o.valeurs.hospO).padEnd(7)+" Ho "+String(o.valeurs.honoO).padEnd(7)+" D "+String(o.valeurs.dent).padEnd(10)+" O "+o.valeurs.opt+(o.palier==="plus"?"  (+1 niveau)":""));
  });
  // Avenir en tête dès qu'une Cap Évolution passe.
  if(passent.some(r=>r.ins==="avenir")&&v.offres.length&&v.offres[0].ins!=="avenir") faute(nom,"Avenir passe mais n'est pas en tête");
  // Une compagnie par offre avant d'en répéter une.
  const ins=v.offres.map(o=>o.ins), cies=new Set(passent.map(r=>r.ins));
  // (l'affichage est par prix : on vérifie que chaque compagnie qui passe est présente avant toute répétition)
  if(new Set(ins).size<Math.min(cies.size,v.nb)) faute(nom,"compagnie répétée alors qu'une autre compagnie passait");
  v.notes.forEach(n=>console.log("   ⓘ "+n));
}
// Sans besoin, rien n'est filtré ; avec des minimums plus hauts, l'offre la moins chère ne baisse jamais.
{
  const rows=lignes(40,true);
  const p0=Vitrine.choisir(rows,{age:40,minimums:{}}).offres.map(o=>o.prix);
  const p1=Vitrine.choisir(rows,{age:40,minimums:{dent:200,opt:300}}).offres.map(o=>o.prix);
  if(!p0.length||!p1.length||Math.min(...p1)<Math.min(...p0)) faute("curseurs","le prix plancher baisse quand les minimums montent");
  if(JSON.stringify(p0)===JSON.stringify(p1)) faute("curseurs","les minimums ne changent pas les offres");
  // « Essentiel » partout ne fait jamais apparaître d'offre plus faible que la sélection de départ (niveau d'office gardé).
  for(const age of [25,40,60]){
    const r=lignes(age,true);
    const s0=Vitrine.choisir(r,{age}).offres.map(o=>o.cle).join();
    const s1=Vitrine.choisir(r,{age,minimums:{hospO:100,honoO:100,dent:100,opt:1}}).offres.map(o=>o.cle).join();
    if(s0!==s1) faute("curseurs "+age+" ans","« Essentiel » partout change la sélection de départ");
  }
}
// --- Conversions APICIL / APRIL pour le serveur du CRM Santéo (accord de Fabrice, 22/11/2026) ----------------------
// Réponses FICTIVES, au format des relais : on vérifie le chemin corps → réponse → Moteur.calculer → Vitrine.choisir.
let nconv=0;
{
  const now=new Date(2026,10,22,8,0), D2=D, F2=F;
  const prof={naissance:"1966",cp:"75011",reg:"SAL",conjoint:null,enfants:0,aujourdHui:now};
  const cA=Vitrine.corpsApicil(prof), cR=Vitrine.corpsApril(prof,G);
  const repA={Formules:Moteur.CODES_APICIL.map((c,i)=>({LibelleFormule:c,TarifFormule:String(90+i*12)}))};
  const repR={environnement:"production",liensFamille:true,produits:cR.produits.map((c,k)=>{
    const g=G.april.gammes[c], n={}; g.niv.forEach((v,i)=>{const kk=("0"+v).slice(-2); if(c==="SanteMix"||c==="FlexiSante"){n[kk+"|"+kk]=100+i*20+k; n[kk+"|"+(kk==="01"?"02":"01")]=1;} else n[kk]=100+i*20+k;});
    return c==="SanteGan"?{produit:c,etat:"refus",code:422,message:"âge"}:{produit:c,etat:"ok",niveaux:n};})};
  const essai=(nom,api,apr,attendu)=>{
    nconv++;
    const dept=Moteur.departement("75011");
    const rows=Moteur.calculer({D:D2,F:F2,sel:Vitrine.selVitrine(G),age:60,cnjAge:null,hasCnj:false,kids:0,reg:"SAL",dept,zone:Moteur.zones(D2)[dept],
      apicil:api,april:apr}).rows;
    const nA=rows.filter(r=>r.key==="APICIL").length, nR=rows.filter(r=>r.key==="APRIL").length;
    const v=Vitrine.choisir(rows,{age:60,G,reg:"SAL"});
    const vA=v.offres.filter(o=>o.key==="APICIL").length, vR=v.offres.filter(o=>o.key==="APRIL").length;
    console.log("● "+nom+" → lignes APICIL "+nA+", APRIL "+nR+" ; offres APICIL "+vA+", APRIL "+vR+" / "+v.offres.length);
    if(attendu.A!==(nA>0)) faute(nom,"lignes APICIL "+nA);
    if(attendu.R!==(nR>0)) faute(nom,"lignes APRIL "+nR);
    if(!attendu.A&&vA) faute(nom,"offre APICIL sans prix");
    if(!attendu.R&&vR) faute(nom,"offre APRIL sans prix");
    if(rows.some(r=>r.key==="APRIL"&&r.april==="SanteGan")) faute(nom,"produit APRIL refusé tarifé");
    if(rows.some(r=>r.key==="APRIL"&&r.total===1)) faute(nom,"niveau hors diagonale gardé");
    v.offres.forEach(o=>{ if(!(o.prix>0)) faute(nom,o.nom+" sans prix"); });
    if(!rows.some(r=>r.key==="CAPEVO")||!rows.some(r=>r.key==="MV")) faute(nom,"gammes locales absentes (sel)");
  };
  essai("APICIL en erreur (HTTP 502), APRIL ok", Vitrine.apicilPourMoteur(cA,502,null), Vitrine.aprilPourMoteur(200,repR,G), {A:false,R:true});
  essai("APICIL ok, APRIL en erreur (pas de réponse)", Vitrine.apicilPourMoteur(cA,200,repA), Vitrine.aprilPourMoteur(0,null,G), {A:true,R:false});
  essai("APICIL ok, APRIL ok", Vitrine.apicilPourMoteur(cA,200,repA), Vitrine.aprilPourMoteur(200,repR,G), {A:true,R:true});
  essai("APICIL réponse sans Formules, APRIL HTTP 500", Vitrine.apicilPourMoteur(cA,200,{}), Vitrine.aprilPourMoteur(500,{erreur:"x"},G), {A:false,R:false});
  // Corps
  nconv++;
  const c75=Vitrine.corpsApril({...prof,cp:"75"},G), a75=Vitrine.corpsApicil({...prof,cp:"75"});
  if(c75.cp!=="75001") faute("corps","APRIL cp 75 → "+c75.cp);
  if(a75.codePostalAssure!=="75000") faute("corps","APICIL cp 75 → "+a75.codePostalAssure);
  if(Vitrine.apicilPourMoteur(a75,200,repA).cpExact!==false) faute("corps","cpExact à tort");
  if(cR.produits.some(c=>G.april.gammes[c].tns)) faute("corps","produit TNS demandé pour un salarié");
  if(cR.produits.includes("OnlySante")) faute("corps","OnlySante (non responsable) demandé");
  if(!Vitrine.corpsApril({...prof,reg:"TNS"},G).produits.includes("SantePro")) faute("corps","SantePro absent en TNS");
  const fam=Vitrine.corpsApicil({...prof,conjoint:"1968",enfants:2});
  if(fam.beneficiaires.map(b=>b.role).join()!=="ASSUR,CONJT,ENFNT,ENFNT"||fam.beneficiaires[1].dateNaissance!=="1968-01-01") faute("corps","famille APICIL");
  if(cA.dateEffetContrat!=="2026-12-01"||cR.effet!=="2026-12-01") faute("corps","date d'effet");
  if(Vitrine.corpsApicil({...prof,naissance:""})!==null||Vitrine.corpsApril({...prof,cp:""},G)!==null) faute("corps","corps sans donnée utile");
  // Cache
  nconv++;
  if(Vitrine.cleCache(cR)!==Vitrine.cleCache(JSON.parse(JSON.stringify(cR)))) faute("cache","clé instable");
  if(Vitrine.cleCache(cR)===Vitrine.cleCache({...cR,cp:"75012"})) faute("cache","clé identique pour deux profils");
  const e1=Vitrine.expireLe(cR,now), e2=Vitrine.expireLe(cR,new Date(2026,10,30,20,0)), e3=Vitrine.expireLe({effet:"2027-01-01"},new Date(2026,11,31,12,0));
  if(e1-now!==24*3600e3) faute("cache","24 h attendues");
  if(e2.getTime()!==new Date(2026,11,1).getTime()) faute("cache","doit expirer à la date d'effet");
  if(e3.getTime()!==new Date(2027,0,1).getTime()) faute("cache","doit expirer au 1er janvier");
  if(Vitrine.gardable(502)||Vitrine.gardable(0)||!Vitrine.gardable(200)) faute("cache","gardable");
  console.log("● corps, cache : vérifiés");
}
console.log(fautes?"\n"+fautes+" écart(s).":"\nAucun écart : "+(CAS.length+CASMIN.length+4+nconv)+" cas.");
process.exit(fautes?1:0);
