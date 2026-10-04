/* Fabrique du « Sélection — tableau de garantie » du comparateur Santéo.
 *
 * Même code pour la page et pour un serveur Node : c'est le tableau que le
 * prospect reçoit, il ne peut pas exister en deux versions qui divergent.
 *
 * Le module ne produit que du HTML. L'image déposée dans le CRM est une capture
 * de ce HTML : la page la prend avec html2canvas, un serveur la prend avec un
 * navigateur sans écran (Playwright / Puppeteer) sur le document rendu par
 * « document() ». Il n'existe pas de façon d'obtenir la même image sans moteur
 * de rendu, la mise en page venant des feuilles de style du navigateur.
 *
 *   const T = require("./tableau.js");
 *   const html = T.document({
 *     G: {gammes, extras, compagnies},     // garanties.json
 *     cols: [{key:"APICIL", fi:4}, …],     // formules retenues
 *     reco: "APICIL|4",                    // formule conseillée (⭐), ou null
 *     tarifs: {"APICIL|4": 103.26},        // cotisations mensuelles, ou {}
 *     prospect: "MME BOUDJEMAA Melissa · née le 12/04/1993",
 *     css: <contenu de src/tableau.css>,
 *   });
 *
 * Navigateur : window.Tableau.   Node : require("./tableau.js").
 */
(function(exporter){
"use strict";

// Lignes du tableau, dans l'ordre d'affichage. « x: » désigne les postes qui ne
// vivent pas dans la gamme elle-même mais dans les garanties complémentaires.
// Le tableau est découpé en blocs, pour la lecture chez le prospect (Fabrice, 03/10/2026) : un bandeau de titre
// par famille, ses lignes dessous. 3e élément à 1 = ligne en gras (parcours OPTAM, prothèses dentaires, verres simples).
const BLOCS=[
  ["Hospitalisation",[["Hospitalisation Optam","hospO",1],["Hospitalisation hors Optam","hospN"],["Chambre particulière","ch"]]],
  ["Honoraires",[["Consult. spécialistes Optam","honoO",1],["Consult. hors Optam","honoN"]]],
  ["Pharmacie",[["Médicaments remboursés","x:pharR"],["Pharmacie non remboursée","x:pharN"]]],
  ["Dentaire",[["Prothèses dentaires","dent",1],["Implantologie","x:imp"],["Orthodontie remboursée","x:orthR"],["Orthodontie non remboursée","x:orthN"]]],
  ["Optique",[["Verres et monture simples","opt",1],["Verres et monture complexes","x:optC"],["Lentilles acceptées","x:lentA"],["Lentilles refusées","x:lentR"]]],
  ["Autres",[["Aides auditives","x:aud"],["Médecine douce / bien-être","md"]]]
];
// Les mêmes lignes à plat : [libellé, source, gras, bloc].
const POSTES=[].concat(...BLOCS.map(([bloc,lignes])=>lignes.map(([lab,src,fort])=>[lab,src,fort?1:0,bloc])));

// Postes mis en avant sous le tableau pour la formule conseillée. Hospitalisation
// et honoraires au parcours OPTAM : le cas courant, et le seul comparable d'une
// compagnie à l'autre.
const ATOUTS=[["hospitalisation","hospO"],["honoraires spécialistes","honoO"],
  ["chambre particulière","ch"],["dentaire","dent"],["implantologie","x:imp"],
  ["orthodontie","x:orthR"],["optique","opt"],["lentilles","x:lentA"],
  ["aides auditives","x:aud"],["médecines douces","md"]];

// Logos déposés dans docs/ (PNG à fond transparent, hauteur utile ~40 px).
// Une gamme peut porter son propre logo (`logo`), distinct de son assureur (`ins`) : Révoluo est vendue
// par Avenir Mutuelle mais sous sa marque.
const LOGOS={mcci:"logo_mcci.png",avenir:"logo_avenir.png",mverte:"logo_mverte.png",apicil:"logo_apicil.png",revoluo:"logo_revoluo.png"};
const LOGOBASE="https://fabcoh.github.io/santeo-tarifs/docs/";

// Notre logo et nos mentions légales, en bas du tableau (Fabrice, 03/10/2026 : « pas jolie le logo en haut,
// place-le en bas du tableau avec les infos légales »). Visible dans la fenêtre comme dans l'image.
function marque(base){
  return '<img class="tgmarque" src="'+((base||LOGOBASE)+"logo_santeobleu.png")+'" alt="Santéo" onerror="this.remove()">';
}
const LEGAL=[
  "Vos données sont nécessaires au bon traitement de votre devis santé par notre équipe uniquement, elles ne sont pas revendues à des tiers, et seront conservées le temps de traitement de votre demande. Vous disposez d’un droit d’accès et de suppression de vos données par un simple mail : gestion@santeo.net.",
  "CAPI FINANCE — 72 rue du Rendez-vous, 75012 Paris · tél. 01 53 19 17 17 · gestion@santeo.net",
  "Garantie financière et assurance de responsabilité civile professionnelle conformes aux articles L.530-1 et L.530-2 du code des Assurances : MATRISK ASSURANCE n° MRCSBRO202310FR00000000053466A00 — SAS au capital de 21 342 € — SIRET 388 103 301 00049 — APE 66222Z — courtier d’assurance n° ORIAS 07001983 (www.orias.fr), sous le contrôle de l’ACPR, 4 place de Budapest, CS 92459, 75436 Paris Cedex 09. N° CNIL 1939276.",
  "Nous sommes membres d’Endya, association d’autorégulation du courtage. En application de l’article L.616-1 du Code de la consommation, le Médiateur de l’Assurance est compétent pour intervenir sur tout litige n’ayant pu être réglé dans le cadre d’une réclamation préalable directement introduite auprès des services de votre courtier. Il peut être saisi par courrier : La Médiation de l’Assurance, TSA 50110, 75441 Paris Cedex 09, ou le.mediateur@mediation-assurance.org.",
  "Mentions légales sur santeo.net/mentions-legales. Santéo est la marque commerciale de CAPI FINANCE."
];
function legal(base){
  return '<div class="tglegal">'+marque(base)+LEGAL.map(t=>'<p>'+t+'</p>').join('')+'</div>';
}

const eur=v=>v==null?"—":v.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";

// « M. VERTE GCI » + « GCI 100 » donne « M. VERTE GCI GCI 100 » : on ôte la répétition.
function nomComplet(G,key,fi){
  return (G.gammes[key].label+" "+G.gammes[key].names[fi]).replace(/(^|\s)(\S+) \2(?=\s|$)/,"$1$2");
}

function valeur(G,key,fi,src){
  const f=G.gammes[key], e=(G.extras||{})[key]||{};
  if(src.startsWith("x:")){const k=src.slice(2);return (e[k]&&e[k][fi]!==undefined)?e[k][fi]:"—";}
  const arr=f&&f[src];return (arr&&arr[fi]!==undefined)?arr[fi]:"—";
}

// Tant qu'un logo manque, le nom de la compagnie s'affiche à sa place : rien ne casse.
function logo(G,key,base){
  const g=G.gammes[key], f=g&&LOGOS[g.logo||g.ins], nom=(G.compagnies||{})[key]||"";
  if(!f) return '<span class="tglogo-txt">'+nom+'</span>';
  return '<img class="tglogo" src="'+((base||LOGOBASE)+f)+'" alt="'+nom+'" '
       + 'onerror="this.outerHTML=\'<span class=&quot;tglogo-txt&quot;>'+nom+'</span>\'">';
}

const PRIXSTYLE="font:800 12.5px 'Archivo',sans-serif;color:var(--accent);margin-top:3px;text-transform:none";

// Contenu d'une case d'en-tête : logo, étoile ou mention de conseil, gamme, formule,
// et le tarif s'il est fourni. La page le réutilise telle quelle quand l'étoile change.
function celluleEntete(G,c,o){
  o=o||{};
  return logo(G,c.key,o.base)
    +(o.reco?'<span class="recolbl">⭐ Je vous conseille</span>'
            :'<span class="star" title="Conseiller cette formule">☆</span>')
    +(o.multi?'<span style="display:block;font-size:11px;opacity:.75">'+G.gammes[c.key].label+'</span>':'')
    +G.gammes[c.key].names[c.fi]
    +(o.tarif!==undefined&&o.tarif!==null
        ?'<div class="thprice" style="'+PRIXSTYLE+'">'+eur(o.tarif)+' /mois</div>':'');
}

function estReco(reco,c){ return reco===(c.key+"|"+c.fi); }

// Les indemnités journalières n'ont de sens que si l'une des formules en verse : en tête du bloc Hospitalisation.
function lignes(G,cols){
  const ij=cols.some(c=>{const v=valeur(G,c.key,c.fi,"ij");return v&&v!=="—";});
  return (ij?[["Indemnités journalières hospitalisation","ij",0,"Hospitalisation"]]:[]).concat(POSTES);
}

function entete(G,cols,reco,o){
  o=o||{};
  const multi=cols.some(c=>c.key!==cols[0].key);
  return '<tr><th></th>'+cols.map((c,ci)=>'<th class="pick'+(estReco(reco,c)?' reco':'')+'" data-ci="'+ci+'">'
    +celluleEntete(G,c,{reco:estReco(reco,c),multi:multi,base:o.base,
                        tarif:o.tarifs?o.tarifs[c.key+"|"+c.fi]:undefined})
    +'</th>').join('')+'</tr>';
}

// Un bandeau par bloc : une case par colonne (et non une seule case étalée), pour que la colonne
// conseillée garde son cadre d'un bout à l'autre du tableau.
function corps(G,cols,reco){
  let bloc=null, h="";
  for(const [lab,src,fort,b] of lignes(G,cols)){
    if(b!==bloc){
      bloc=b;
      h+='<tr class="tgsec"><td>'+b+'</td>'+cols.map(c=>'<td'+(estReco(reco,c)?' class="reco"':'')+'></td>').join('')+'</tr>';
    }
    h+='<tr'+(fort?' class="fort"':'')+'><td>'+lab+'</td>'
      +cols.map(c=>'<td'+(estReco(reco,c)?' class="reco"':'')+'>'+valeur(G,c.key,c.fi,src)+'</td>').join('')
      +'</tr>';
  }
  return h;
}

// Atouts de la formule conseillée, poste par poste ; les postes sans garantie sont omis.
function atouts(G,key,fi){
  const bits=ATOUTS.map(([lab,src])=>{const v=valeur(G,key,fi,src);
    return (v&&v!=="—")?lab+" <b>"+v+"</b>":"";}).filter(Boolean);
  if(!bits.length)return "";
  return 'Ce produit correspond à votre demande — <b>'+nomComplet(G,key,fi)
        +'</b> : '+bits.join(", ")+'. <span style="opacity:.8">(hospitalisation et honoraires : parcours OPTAM)</span>';
}

// Libellés normalisés : le prospect cherche « le tableau de garantie », pas « TG PDF ».
function libelleDoc(k){
  if(/^IPID/.test(k)) return "IPID";
  if(/^Conditions/i.test(k)) return "Conditions générales";
  if(/adh[ée]sion|bulletin/i.test(k)) return "Demande d'adhésion";
  if(/^Notice/i.test(k)) return "Notice";
  if(/notice/i.test(k)) return "Tableau de garantie + notice";
  if(/IPID/.test(k)) return "Garanties + IPID";
  return "Tableau de garantie";
}

// Documents de la formule affichée. Une adresse vaut pour toute la gamme ; un tableau
// est indexé sur la formule, pour les documents qui en dépendent — APICIL publie une
// plaquette par gamme Équilibre et une seule pour toutes les Sérénité, et l'IPID de
// La Mutuelle Verte ne couvre que GCI 500. Un document absent n'apparaît pas.
// reg (facultatif) : régime du prospect. Une gamme dont les TNS relèvent d'un autre produit
// (Cap Evolution TNS chez Avenir) porte une entrée « CLE_TNS » ; vide, elle ne publie aucun
// document plutôt que ceux des salariés — jamais de lien vers un document qui ne la concerne pas.
function documents(G,key,fi,reg){
  const D=G.documents||{};
  const d=(/^TNS/.test(reg||"")&&D[key+"_TNS"]!==undefined)?D[key+"_TNS"]:D[key]; if(!d) return [];
  const out=[];
  for(const k of Object.keys(d)){
    const v=d[k], url=Array.isArray(v)?v[fi]:v;
    if(url) out.push({libelle:libelleDoc(k),url:url});
  }
  return out;
}

// Limites et délais de carence : une chaîne pour la gamme, ou une par formule.
function limites(G,key,fi){
  const l=(G.limites||{})[key];
  if(Array.isArray(l)) return l[fi]||"";
  return l||"";
}

// Bas du tableau : ce que le prospect doit voir de chaque formule comparée — ses
// documents contractuels et ce qui borne ses remboursements. Sans formule conseillée,
// la note de gamme fournie par l'appelant reste affichée.
function pied(G,cols,note,reco,reg){
  const c=cols.find(x=>estReco(reco,x));
  const av=c?atouts(G,c.key,c.fi):"";
  const blocs=cols.map(x=>{
    const g=G.gammes[x.key]; if(!g) return "";
    const liens=documents(G,x.key,x.fi,reg)
      .map(d=>'<a class="tgdoc" href="'+d.url+'" target="_blank" rel="noopener">'+d.libelle+'</a>')
      .join(' <span class="tgsep">·</span> ');
    const nr=g.resp===false?'<b class="tgnr">Contrat NON responsable.</b> ':'';
    // Les limites de certaines gammes commencent déjà par la mention : on ne la répète pas.
    const lim=nr?String(limites(G,x.key,x.fi)||"").replace(/^\s*Contrat NON responsable\.\s*/i,""):limites(G,x.key,x.fi);
    if(!liens&&!lim&&!nr) return "";
    return '<div class="tglim"><b>'+nomComplet(G,x.key,x.fi)+'</b>'
      +(liens?' <span class="tgsep">—</span> '+liens:"")
      +((nr||lim)?'<div class="tgcar">'+nr+lim+'</div>':"")
      +'</div>';
  }).filter(Boolean).join("");
  if(!av&&!blocs) return note||"";
  return av+blocs;
}

// Base du devis, en bas du tableau, avant nos mentions (Fabrice, 04/10/2026) : date, assurés, département,
// régime, puis la validité en plus petit et en italique. b = {date:"jj/mm/aaaa", dept, cp, regime,
// assures:[{lien:"assure"|"conjoint"|"enfant", naissance:"jj/mm/aaaa"|"aaaa"|âge|""}]}. Absent : rien.
const VALIDITE=10;
const REGIMES={SAL:"Sécurité sociale (salarié)",TNS:"Sécurité sociale (TNS)",RL:"Alsace-Moselle (salarié)",TNSRL:"Alsace-Moselle (TNS)"};
function naissanceTxt(n,lien){
  n=String(n||"").trim();
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(n))return "né(e) le "+n;
  if(/^\d{4}$/.test(n))return "né(e) en "+n;
  if(/^\d{1,3}$/.test(n))return n+" ans";
  return lien==="enfant"?"mineur":"date non communiquée";
}
function baseDevisLignes(b){
  if(!b||!Array.isArray(b.assures)||!b.assures.length||!/^\d{2}\/\d{2}\/\d{4}$/.test(b.date||""))return null;
  const [j,m,a]=b.date.split("/").map(Number), fin=new Date(a,m-1,j+VALIDITE);
  const jusqu=String(fin.getDate()).padStart(2,"0")+"/"+String(fin.getMonth()+1).padStart(2,"0")+"/"+fin.getFullYear();
  const n=b.assures.length, lieu=b.cp?"Département "+String(b.cp).slice(0,2)+" ("+b.cp+")":(b.dept?"Département "+b.dept:"");
  return {titre:"Devis établi le "+b.date,
          resume:[n+" assuré"+(n>1?"s":""),lieu,REGIMES[b.regime]?"Régime : "+REGIMES[b.regime]:""].filter(Boolean).join(" · "),
          assures:b.assures.map((x,i)=>"Assuré "+(i+1)+(x.lien==="conjoint"?" (conjoint)":x.lien==="enfant"?" (enfant)":"")+" : "+naissanceTxt(x.naissance,x.lien)),
          validite:"Devis valable "+VALIDITE+" jours à compter du "+b.date+", soit jusqu’au "+jusqu+"."};
}
function baseDevis(b){
  const L=baseDevisLignes(b); if(!L)return "";
  return '<div class="tgbase"><p><b>'+L.titre+'</b> · '+L.resume+'</p>'+L.assures.map(t=>'<p>'+t+'</p>').join('')
    +'<p class="tgvalid">'+L.validite+'</p></div>';
}
const MENTION=' · synthèse d’après le tableau de garantie officiel — seuls les documents contractuels (TG, notice, IPID) font foi.';

// Corps du cadre, tel qu'il est capturé : ni bouton de fermeture, ni barre d'actions.
function bloc(G,o){
  o=o||{};
  return '<h2>'+(o.titre||"Sélection — tableau de garantie")+'</h2>'
    +(o.prospect?'<div class="tghdr" style="font:700 16.5px \'Archivo\',sans-serif;color:var(--accent);margin:2px 0 8px">'+o.prospect+'</div>':'')
    +'<div class="src">'+(o.sousTitre||"")+MENTION+'</div>'
    +'<div style="overflow-x:auto"><table><thead>'
    +entete(G,o.cols,o.reco,{tarifs:o.sansTarifs?null:o.tarifs,base:o.base})
    +'</thead><tbody>'+corps(G,o.cols,o.reco)+'</tbody></table></div>'
    +'<div class="foot">'+pied(G,o.cols,o.note,o.reco)+'</div>'+baseDevis(o.devis)+legal(o.base);
}

// Document autonome, à ouvrir dans un navigateur sans écran puis à capturer sur #tgbox.
// La classe « capwide » est celle que la page applique au moment de la capture.
function documentHTML(G,o){
  o=o||{};
  return '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
    +'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">\n'
    +'<style>'+(o.css||"")+'\nbody{margin:0;background:#fff}#tgov{position:static;background:none;padding:0;display:block}</style>\n'
    +'</head>\n<body>\n<div id="tgov"><div id="tgbox" class="capwide">'+bloc(G,o)+'</div></div>\n</body>\n</html>\n';
}

exporter.POSTES=POSTES;
exporter.BLOCS=BLOCS;
exporter.ATOUTS=ATOUTS;
exporter.LOGOBASE=LOGOBASE;
exporter.valeur=valeur;
exporter.logo=logo;
exporter.marque=marque;
exporter.legal=legal;
exporter.LEGAL=LEGAL;
exporter.VALIDITE=VALIDITE;
exporter.baseDevis=baseDevis;
exporter.baseDevisLignes=baseDevisLignes;
exporter.celluleEntete=celluleEntete;
exporter.lignes=lignes;
exporter.entete=entete;
exporter.corps=corps;
exporter.atouts=atouts;
exporter.nomComplet=nomComplet;
exporter.documents=documents;
exporter.limites=limites;
exporter.pied=pied;
exporter.bloc=bloc;
exporter.document=documentHTML;
exporter.eur=eur;

})(typeof module!=="undefined"&&module.exports ? module.exports
   : ((typeof self!=="undefined"?self:this).Tableau={}));
