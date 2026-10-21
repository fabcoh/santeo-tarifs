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
const LOGOS={mcci:"logo_mcci.png",avenir:"logo_avenir.png",mverte:"logo_mverte.png",apicil:"logo_apicil.png",revoluo:"logo_revoluo.png",april:"logo_april.png"};
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
// Sous le tableau, seulement le logo et deux lignes (Fabrice, 04/10/2026 : « tu supprimes les textes au-dessus du logo,
// laisse juste le logo Santéo et les infos légales sur santeo.net »). LEGAL reste pour qui en aurait besoin (le courrier).
function legal(base){
  return '<div class="tglegal">'+marque(base)+'<p class="tgdepuis">Courtier comparateur depuis 1992</p><p>Infos légales : www.santeo.net</p></div>';
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

// Prothèses à deux taux (Mutuelle Verte : « dents visibles » / « autres dents », Fabrice 21/10/2026) : `dent` porte le taux le plus
// bas — celui des calculs, des filtres et des images —, `x:dentV` celui des dents visibles. `affiche` les écrit tous les deux.
function dentVisibles(G,key,fi){
  const v=valeur(G,key,fi,"x:dentV"); return v!=="—"&&v!==valeur(G,key,fi,"dent")?v:"";
}
function affiche(G,key,fi,src){
  const v=valeur(G,key,fi,src);
  if(src!=="dent") return v;
  const dv=dentVisibles(G,key,fi);
  return dv?v+" (dents visibles : "+dv+")":v;
}

// Tant qu'un logo manque, le nom de la compagnie s'affiche à sa place : rien ne casse.
// Dimensions des fichiers (px) : la vignette du cumul égalise la surface des logos, pas leur hauteur — un bandeau (MCCI,
// 545 × 160) à la même hauteur qu'un logo presque carré (Avenir, 211 × 160) paraissait deux fois plus gros (Fabrice, 20/10/2026).
const LOGODIM={mcci:[545,160],avenir:[211,160],mverte:[363,160],apicil:[558,155],revoluo:[325,160],april:[681,160]};
function logoEgal(G,key,base,cote,hmax){
  const g=G.gammes[key], k=g&&(g.logo||g.ins), d=LOGODIM[k];
  if(!d) return logo(G,key,base);
  let h=cote*Math.sqrt(d[1]/d[0]); if(h>hmax) h=hmax;
  const w=Math.round(h*d[0]/d[1]); h=Math.round(h);
  return logo(G,key,base).replace('<img class="tglogo" ','<img class="tglogo" width="'+w+'" height="'+h+'" style="width:'+w+'px;height:'+h+'px;max-width:none;max-height:none" ');
}
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
      +cols.map(c=>'<td'+(estReco(reco,c)?' class="reco"':'')+'>'+valeur(G,c.key,c.fi,src)
        +(src==="dent"&&dentVisibles(G,c.key,c.fi)?'<div class="tgdv">dents visibles : '+dentVisibles(G,c.key,c.fi)+'</div>':'')+'</td>').join('')
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

// Pied court (Fabrice, 04/10/2026) : ni atouts de l'étoile ni limites par formule ; seule reste la mention
// « contrat non responsable », due au prospect, une ligne par formule concernée.
function piedCourt(G,cols){
  return cols.map(x=>{const g=G.gammes[x.key];
    // Gamme non responsable, ou formule seule (GCI 500) dont les limites commencent par la mention.
    const nr=g&&(g.resp===false||/^\s*Contrat NON responsable/i.test(String(limites(G,x.key,x.fi)||"")));
    return nr?'<div class="tgnrl"><b>'+nomComplet(G,x.key,x.fi)+'</b> : contrat non responsable.</div>':"";})
    .filter(Boolean).join("");
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
    +'<div class="foot">'+piedCourt(G,o.cols)+'</div>'+baseDevis(o.devis)+legal(o.base);
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

// ---- Cumul mutuelle + surcomplémentaire (Fabrice, 19/10/2026) -------------------------------
// Une vignette à envoyer sur WhatsApp : la mutuelle principale, la surcomplémentaire (TALIS) et le
// total, poste par poste, puis les deux cotisations additionnées. En grille de <div> et non en
// <table> : les règles des tableaux de la page (colonnes collantes, majuscules) ne s'y appliquent pas.
// Additions : % + % ; € + € (l'unité commune est gardée, « /j » ; sinon « 600 € ») ; % + € sur une
// ligne (« 200 % + 100 € »). Une valeur qui porte une précision (« 30 €/an (tabac) », « 3×20 € »)
// n'est jamais additionnée : « 30 € (tabac) + 50 € » ferait croire à 80 € pour tout (vérité des chiffres).
function cuLire(s){
  s=String(s==null?"":s).replace(/ /g," ").trim();
  if(!s||s==="—"||/^n\.c\./i.test(s))return null;
  s=s.replace(/^\+\s*/,"");
  s=s.replace(/\s*BR$/,"");
  if(/[(×]/.test(s))return {raw:s};
  let m=s.match(/^(\d[\d\s]*)\s*%$/); if(m)return {n:+m[1].replace(/\s/g,""),u:"%"};
  m=s.match(/^(\d[\d\s]*)\s*€(\/\S+)?$/); if(m)return {n:+m[1].replace(/\s/g,""),u:"€",s:m[2]||""};
  return {raw:s};
}
const cuNb=n=>n.toLocaleString("fr-FR");
const cuTxt=p=>p.raw||(p.u==="%"?p.n+" %":cuNb(p.n)+" €"+p.s);
function cumulTotal(a,b){
  const A=cuLire(a),B=cuLire(b);
  if(!A&&!B)return "—"; if(!A)return cuTxt(B); if(!B)return cuTxt(A);
  if(A.raw||B.raw)return cuTxt(A)+'<span class="cu-2">+ '+cuTxt(B)+'</span>';
  if(A.u==="%"&&B.u==="%")return (A.n+B.n)+" %";
  if(A.u==="€"&&B.u==="€")return cuNb(A.n+B.n)+" €"+(A.s===B.s?A.s:"");
  const P=A.u==="%"?A:B,E=A.u==="%"?B:A;
  return '<span class="cu-mx">'+P.n+" % + "+cuNb(E.n)+" €</span>";
}
const CU_POSTES={hospO:"Hospitalisation Optam",hospN:"Hospitalisation hors Optam",ch:"Chambre particulière",
  honoO:"Spécialistes Optam",honoN:"Spécialistes hors Optam","x:pharR":"Médicaments remboursés","x:pharN":"Pharmacie non remboursée",
  dent:"Prothèses dentaires","x:imp":"Implantologie","x:orthR":"Orthodontie remboursée","x:orthN":"Orthodontie non remb.",
  opt:"Verres et monture simples","x:optC":"Verres et monture complexes","x:lentA":"Lentilles acceptées","x:lentR":"Lentilles refusées",
  "x:aud":"Aides auditives",md:"Médecines douces"};
const CU_GAINS=[["hospO","Hospitalisation"],["dent","Prothèses"],["x:imp","Implant"],["opt","Lunettes"],["ch","Chambre"],["x:aud","Audition"]];
// Ce que la vignette rappelle de la surcomplémentaire : court, le prospect le lit sur un téléphone.
const CU_NOTE={TALIS:fi=>"délai d’attente de 90 jours en dentaire et en optique ; plafond dentaire "+(fi?"900":"600")+" € par an et par personne ; 1 équipement optique par an"};
// Implantologie : un montant ne veut pas dire la même chose d'une compagnie à l'autre (relu dans les fiches
// docs/connaissances, 19/10/2026). « acte » = par implant ; « an » = forfait annuel, souvent commun à d'autres actes ;
// « pct » = pourcentage de la base Sécurité sociale. La vignette marque le total d'une * et l'explique dessous.
const cuImpAn=suite=>v=>"forfait de "+v+" par an et par personne"+(suite?", commun avec "+suite:"");
const CU_IMP={
  CAPEVO:["acte",v=>v+" par implant, dans le plafond dentaire annuel"],
  CAPNR:["acte",v=>v+" par implant, dans le plafond dentaire annuel"],
  TALIS:["acte",(v,fi)=>v+" par implant, dans le plafond dentaire de "+(fi?"900":"600")+" € par an"],
  APICIL:["acte",v=>v+" par implant, 2 implants au plus par an"],
  MCCINOVA:["pct",v=>v+" de la base Sécurité sociale, seulement pour les implants que la Sécurité sociale rembourse (rares)"],
  FLEXIA:["an",v=>"forfait de "+v+" par an"],
  SOLENCIA:["an",v=>"forfait de "+v+" par an, 2 implants au plus"],
  MV:["an",cuImpAn("la parodontie et l’orthodontie non remboursées")],
  REV:["an",cuImpAn("les prothèses non remboursées et la parodontologie")],
  RF50:["an",cuImpAn("les prothèses non remboursées et la parodontologie")],
  RF100:["an",cuImpAn("les prothèses non remboursées et la parodontologie")],
  APRIL:["an",v=>"forfait de "+v+" par an, souvent commun à d’autres soins dentaires non remboursés"]
};
// Orthodontie non remboursée, même logique : « an » = forfait annuel, « sem » = par semestre, « pct » = % de la base.
// SOLENCIA n'en a pas (tableau de garantie p. 4 : seulement « parodontologie et prothèses non prises en charge »).
const CU_ORTHN={
  CAPEVO:["an",v=>"forfait de "+v+" par an et par personne, dans le plafond dentaire annuel"],
  CAPNR:["sem",v=>v+" par semestre, dans le plafond dentaire annuel"],
  TALIS:["sem",(v,fi)=>v+" par semestre, dans le plafond dentaire de "+(fi?"900":"600")+" € par an"],
  FLEXIA:["an",v=>"forfait de "+v+" par an, commun avec la parodontologie et les prothèses fixes non remboursées"],
  MV:["an",cuImpAn("les implants et la parodontie non remboursés")],
  REV:["pct",v=>v+" de la base de remboursement (base non précisée dans le tableau pour un acte non remboursé)"],
  RF50:["pct",v=>v+" de la base de remboursement (base non précisée dans le tableau pour un acte non remboursé)"],
  RF100:["pct",v=>v+" de la base de remboursement (base non précisée dans le tableau pour un acte non remboursé)"],
  APRIL:["an",v=>"forfait de "+v+" par an, souvent commun à d’autres soins dentaires non remboursés"]
};
function cuDef(T,G,c,v){
  const d=T[c.key]; if(!d||!cuLire(v))return null;
  return {type:d[0],v:cuLire(v),txt:'<b>'+nomComplet(G,c.key,c.fi).replace(/^TALIS Talis/,"TALIS")+'</b> : '+d[1](String(v).replace(/\/(impl|sem)$/,""),c.fi)};
}
// Postes dont le total porte une * : la note explique, sous la grille, ce que vaut chaque montant.
const CU_AST={
  "x:imp":{titre:"Implantologie",T:CU_IMP,fin:(a,b)=>
    a.type==="acte"&&b.type==="acte"?" Total par implant."
    :(a.type==="an"||b.type==="an")?" Le total vaut pour un implant ; au-delà, seul le montant par implant s’ajoute.":""},
  "x:orthN":{titre:"Orthodontie non remboursée",T:CU_ORTHN,fin:(a,b)=>{
    if(a.type==="sem"&&b.type==="sem")return " Total par semestre.";
    const an=a.type==="an"?a:b.type==="an"?b:null, se=a.type==="sem"?a:b.type==="sem"?b:null;
    if(an&&se&&an.v.u==="€"&&se.v.u==="€")return " Sur un an : "+cuNb(an.v.n)+" € + 2 × "+cuNb(se.v.n)+" € = "+cuNb(an.v.n+2*se.v.n)+" €, dans la limite des plafonds.";
    return "";}}
};
const cuPlus=v=>{const p=cuLire(v);return p?"+ "+cuTxt(p):"—";};
// ---- Projet de soins du prospect (Fabrice, 20/10/2026 : « il a 1000 € en implant et 600 € de prothèse, il paie 100 €/mois…
// plus on remplit ce tableau et plus la personne gagne ») : nombre + prix par soin, sur un an. Les pourcentages incluent la
// Sécurité sociale et se calculent sur le tarif de convention (Fabrice : couronne 120 €, bridge 279,50 €, inlay-core 90 €,
// orthodontie remboursée 193,50 € par semestre ; implants et orthodontie non remboursée au forfait). Chaque contrat paie dans
// l'ordre — Sécurité sociale, mutuelle, surcomplémentaire — jamais plus que la dépense ; le gain = ce que paient les deux
// contrats − leurs cotisations sur un an.
// [id, libellé, poste, base de convention, taux Sécu, unité, forfait sans unité : "u" par unité | "an" par an]
const CU_DEP=[
  ["cour","Couronnes","dent",120,.6,"couronne","u"],
  ["bri","Bridges","dent",279.5,.6,"bridge","u"],
  ["inl","Inlay-core","dent",90,.6,"inlay-core","u"],
  ["imp","Implants","x:imp",0,0,"implant","imp"],
  // Références Assurance maladie (ameli.fr), confirmées par Fabrice le 21/10/2026 : orthodontie remboursée avant 16 ans seulement,
  // 100 % de 193,50 € par semestre ; prothèses 60 % du tarif de convention ; implants, lunettes, lentilles, médecines douces : 0 €.
  ["orR","Orthodontie remboursée (moins de 16 ans)","x:orthR",193.5,1,"semestre","u"],
  ["orN","Orthodontie non remboursée","x:orthN",0,0,"semestre","orN"],
  ["lun","Lunettes (verres simples)","opt",0,0,"équipement","u"],
  ["len","Lentilles","x:lentA",0,0,"an","an"],
  ["chb","Chambre particulière","ch",0,0,"jour","u"],
  // Comptés d'office au forfait de l'année (Fabrice, 20/10/2026 : « les médecines douces… tu mets leur forfait directement, ça
  // permet de déduire un peu la cotisation… même pour la pharmacie non remboursée ») : dépense = forfait mutuelle + surco.
  ["md","Médecines douces (ostéo, chiro…)","md",0,0,"an","fan"],
  ["phn","Pharmacie non remboursée","x:pharN",0,0,"an","fan"]
];
const CU_DENT=new Set(["cour","bri","inl","imp","orR","orN"]);
const CU_IMP_MAX={APICIL:2};                                    // « 2 implants au plus par an »
// Plafonds dentaires annuels, 1re année d'adhésion, par bénéficiaire, sur ce que paie le contrat (Sécu non comprise) —
// relus dans les fiches docs/connaissances (Fabrice, 20/10/2026 : « faire attention aux plafonds… vérifier les plafonds
// dentaires dans chacun des cas »). [montants par formule (null = aucun), soins concernés, source]. P = prothèses (couronne,
// bridge, inlay-core), O = orthodontie, I = implants. Au-delà, un contrat responsable paie encore le ticket modérateur des
// soins remboursés par la Sécurité sociale (« au-delà 100 % BR ») ; un forfait n'est plus payé.
const CU_PLAFD={
  CAPEVO:[[null,600,1000,1100],"POI"],
  CAPNR:[[null,null,null,600,700,800,1000],"POI"],
  TALIS:[[600,900],"POI"],
  FLEXIA:[[null,2500,2500,2500],"P"],
  SOLENCIA:[[2000,2000,2000,2000],"P"],
  MV:[[null,750,750,1000,1200],"POI"],
  REV:[[null,null,null,null,null,null,1400,2000],"POI"],
  RF50:[[null,null,null,null,null,1400,2000],"POI"],
  APICIL:[[null,null,500,700,800,1000,500,700,800,800,1000],"P"]
};
// Gammes dont le plafond n'est pas écrit dans les documents : la vignette le dit plutôt que de calculer sans.
const CU_PLAF_NC={MCCINOVA:"non précisé dans les documents",RF100:"plafond du Renfort 100 non précisé dans les documents"};
const CU_APRIL_PLAF_SOINS={SantePro:"PO",SanteProStart:"PO",SanteGan:"POI"};
// Seuls les soins dentaires entrent dans le plafond dentaire : lunettes, lentilles, chambre, médecines douces, pharmacie n'y sont pas.
const cuSoin=id=>id==="imp"?"I":(id==="orR"||id==="orN")?"O":(id==="cour"||id==="bri"||id==="inl")?"P":"-";
// Plafond d'une formule : {m: montant | null, soins, txt} ; null si la gamme n'en a pas.
function cuPlafond(G,c){
  if(c.key==="APRIL"){
    const v=String(valeur(G,"APRIL",c.fi,"x:plaf")), m=v.match(/^(\d[\d\s]*)\s*€/);
    if(!m) return /^n\.c/i.test(v)?{m:null,nc:"non vérifié"}:null;
    const code=((G.extras||{}).APRIL||{}).cumCode, cd=code&&code[c.fi];
    return {m:+m[1].replace(/\s/g,""),soins:CU_APRIL_PLAF_SOINS[cd]||"P"};
  }
  if(CU_PLAF_NC[c.key]) return {m:null,nc:CU_PLAF_NC[c.key]};
  const d=CU_PLAFD[c.key]; if(!d) return null;
  const m=d[0][c.fi]; return m==null?null:{m,soins:d[1]};
}
const cuR=x=>Math.round(x*100)/100;
// Ce que paie un contrat sur les restes à charge `rest` (un par unité). null = non chiffrable (valeur en texte).
// Forfait de l'année d'un poste « au forfait » (médecines douces, pharmacie non remboursée) : « 5×40 € » = 5 séances à 40 € ;
// « 30 €/s » = par séance, 3 séances au plus (Mutuelle Verte, TG p.3) ; « 120 €/an » ou « 30 € » = forfait annuel. Une précision
// entre parenthèses (« (tabac) » : l'antitabac de la Mutuelle Verte, pas la pharmacie) ne compte pas.
const CU_SEANCES={MV:3};
function cuForfaitAn(G,c,src){
  const v=String(valeur(G,c.key,c.fi,src)).replace(/ /g," ").replace(/^\+\s*/,"").trim();
  if(/\(/.test(v)) return 0;
  let m=v.match(/^(\d+)\s*×\s*(\d+)\s*€/); if(m) return +m[1]*+m[2];
  m=v.match(/^(\d+)\s*€\/s$/); if(m) return (CU_SEANCES[c.key]||1)*+m[1];
  m=v.match(/^(\d[\d\s]*)\s*€(\/an)?$/); if(m) return +m[1].replace(/\s/g,"");
  return 0;
}
const CU_AUTO=new Set(["md","phn"]);
function cuPaie(G,c,L,rest){
  // « n.c. » (garantie non relevée) n'est jamais un zéro : la ligne devient « à confirmer » (Fabrice, 21/10/2026).
  if(/^n\.c/i.test(String(valeur(G,c.key,c.fi,L[2])))) return null;
  if(L[6]==="fan"){ let e=cuForfaitAn(G,c,L[2]); return rest.map(r=>{const x=Math.min(r,e);e-=x;return x;}); }
  const v=valeur(G,c.key,c.fi,L[2]), P=cuLire(v), z=rest.map(()=>0);
  if(!P) return z;
  if(P.raw) return null;
  if(P.u==="%"){
    if(!L[3]){ if(L[0]==="orN") return null; return z; }      // pas de base Sécu : implants, optique, lentilles
    const cap=Math.max(0,P.n/100*L[3]-(c.sur?0:L[4]*L[3]));    // mutuelle : % Sécu comprise ; surcomplément : en plus
    return rest.map(r=>Math.min(r,cap));
  }
  let mode=L[6];
  if(P.s==="/an") mode="an"; else if(P.s) mode="u";
  else if(mode==="imp") mode=((CU_IMP[c.key]||[])[0]==="an")?"an":"u";
  else if(mode==="orN"){ const t=(CU_ORTHN[c.key]||[])[0]; mode=t==="an"?"an":"u"; }
  if(mode==="an"){ let e=P.n; return rest.map(r=>{const x=Math.min(r,e);e-=x;return x;}); }
  const max=L[0]==="imp"&&CU_IMP_MAX[c.key]?CU_IMP_MAX[c.key]:Infinity;
  return rest.map((r,i)=>i<max?Math.min(r,P.n):0);
}
// dep = {id:{n,p}} ; rend {lignes:[{id,lib,n,p,dep,secu,mut,sur,reste,nc}], dep, secu, mut, sur, reste, nc}
function cumulDepenses(G,M,S,dep){
  const out={lignes:[],dep:0,secu:0,mut:0,sur:0,reste:0,nc:false};
  const PM=cuPlafond(G,M), PS=S?cuPlafond(G,S):null, respM=((G.gammes||{})[M.key]||{}).resp!==false;
  let restM=PM&&PM.m!=null?PM.m:Infinity, restS=PS&&PS.m!=null?PS.m:Infinity;
  out.plafM=PM; out.plafS=PS;
  // Applique un plafond unité par unité : `pay` = ce que paierait le contrat, `tm` = ticket modérateur dû au-delà.
  const plafonne=(pay,P,id,reste,tm)=>{
    if(!P||P.m==null||P.soins.indexOf(cuSoin(id))<0) return {pay,reste,atteint:false};
    let atteint=false; const o=pay.map((x,i)=>{
      if(x<=reste.v){reste.v-=x;return x;}
      atteint=true; const y=Math.max(reste.v,Math.min(x,tm[i]||0)); reste.v=0; return y;});
    return {pay:o,atteint};
  };
  const RM={v:restM}, RS={v:restS};
  for(const L of CU_DEP){
    const d=(dep||{})[L[0]]; if(!d) continue;
    // « auto » : la dépense de l'année vaut les deux forfaits réunis — le prospect les consomme, ils sont remboursés en entier.
    const auto=!!d.auto&&L[6]==="fan";
    if(auto&&/^n\.c/i.test(String(valeur(G,M.key,M.fi,L[2])))){
      out.lignes.push({id:L[0],lib:L[1],u:L[5],n:1,p:0,auto,dep:0,secu:0,mut:0,sur:0,reste:0,nc:true,atM:false,atS:false}); out.nc=true; continue; }
    const p=auto?cuForfaitAn(G,M,L[2])+(S?cuForfaitAn(G,S,L[2]):0):(+d.p||0), n=auto?1:Math.max(1,Math.min(40,Math.round(+d.n||1))); if(!(p>0)) continue;
    let rest=Array(n).fill(p);
    const secu=rest.map(r=>Math.min(r,L[4]*L[3])); rest=rest.map((r,i)=>r-secu[i]);
    let a=cuPaie(G,M,L,rest), atM=false, atS=false;
    if(a){ const tm=rest.map(r=>respM&&L[3]?Math.min(r,L[3]*(1-L[4])):0);
      const q=plafonne(a,PM,L[0],RM,tm); a=q.pay; atM=q.atteint; rest=rest.map((r,i)=>r-a[i]); }
    let b=S?cuPaie(G,Object.assign({sur:1},S),L,rest):rest.map(()=>0);
    if(b){ const q=plafonne(b,PS,L[0],RS,rest.map(()=>0)); b=q.pay; atS=q.atteint; }
    const sm=x=>x?x.reduce((u,v)=>u+v,0):0;
    const l={id:L[0],lib:L[1],u:L[5],n,p,auto,dep:n*p,secu:sm(secu),mut:sm(a),sur:sm(b),nc:!a||!b,atM,atS};
    // Règle absolue (Fabrice, 20/10/2026 : « on ne peut pas rembourser plus que ce qui est dû ») : Sécu + mutuelle +
    // surcomplémentaire ne dépassent jamais la dépense ; un excédent, s'il apparaissait, serait retiré au dernier payeur.
    let trop=cuR(l.secu+l.mut+l.sur-l.dep);
    if(trop>0){ const x=Math.min(trop,l.sur); l.sur-=x; trop-=x; l.mut=Math.max(0,l.mut-trop); }
    l.reste=cuR(l.dep-l.secu-l.mut-l.sur);
    out.lignes.push(l);
    for(const k of ["dep","secu","mut","sur","reste"]) out[k]=cuR(out[k]+l[k]);
    if(l.nc) out.nc=true;
  }
  return out;
}
const cuE=n=>cuNb(Math.round(n))+" €";
// Libellés au singulier, pour la carte de chaque soin et le récapitulatif (« 1 000 € (implant) »).
const CU_DEPLIB={cour:["Prothèse dentaire (couronne)","prothèses"],bri:["Bridge","bridges"],inl:["Inlay-core","inlay-core"],
  imp:["Implant","implants"],orR:["Orthodontie remboursée (moins de 16 ans)","orthodontie"],orN:["Orthodontie non remboursée","orthodontie non remb."],
  lun:["Lunettes","lunettes"],len:["Lentilles","lentilles"],chb:["Chambre particulière","chambre"],
  md:["Médecines douces (ostéo, chiro…)","médecines douces"],phn:["Pharmacie non remboursée","pharmacie"]};
// Présentation pour un néophyte (Fabrice, 20/10/2026) : une carte par soin — coût, mutuelle de base (Sécu comprise) puis
// surcomplémentaire, chacune avec son remboursement et le reste à payer —, puis « Vous payez sur 12 mois… », « Vous êtes
// remboursé de… » et le gain = tout ce qui est remboursé (Sécu comprise) − les cotisations de l'année.
// Plafonds dentaires appliqués, en clair (1re année d'adhésion).
function cuPlafTxt(G,M,S,R){
  const nom=c=>nomComplet(G,c.key,c.fi).replace(/^TALIS Talis/,"TALIS").replace(/^TALIS TALIS/,"TALIS");
  const dent=R.lignes.some(l=>"cour bri inl imp orR orN".indexOf(l.id)>=0); if(!dent) return "";
  const t=(c,P)=>!P?nom(c)+' : pas de plafond dentaire':P.m==null?nom(c)+' : plafond '+P.nc:nom(c)+' : '+cuNb(P.m)+' € par an';
  return 'Plafonds dentaires (1re année d’adhésion, appliqués) — '+t(M,R.plafM)+' ; '+t(S,R.plafS)+'.';
}
// Délai d'attente de la surcomplémentaire, écrit près des soins (TALIS : 90 jours en dentaire et en optique, TG p.2-3).
const CU_CARENCE={TALIS:"délai d’attente de 90 jours en dentaire et en optique"};
// Bilan de l'année, trois situations (critique relue avec Fabrice, 20/10/2026 : « ok ») — la Sécurité sociale paie la même
// chose dans les trois, elle s'annule. Coût réel = cotisations de l'année + reste à payer sur les soins indiqués.
function cuBilan(R,p1,p2){
  const c1=p1!=null?cuR(p1*12):null, c2=p2!=null?cuR(p2*12):null;
  const sans={cot:0,rem:R.secu,reste:cuR(R.dep-R.secu)}, mut={cot:c1,rem:cuR(R.secu+R.mut),reste:cuR(R.dep-R.secu-R.mut)},
        tout={cot:c1!=null&&c2!=null?cuR(c1+c2):null,rem:cuR(R.secu+R.mut+R.sur),reste:R.reste};
  for(const x of [sans,mut,tout]) x.total=x.cot!=null?cuR(x.cot+x.reste):null;
  const plusS=tout.total!=null&&mut.total!=null?cuR(mut.total-tout.total):null;   // ce que TALIS fait gagner
  return {sans,mut,tout,plusS,remS:R.sur,cotS:c2};
}
function cuDepHTML(G,M,S,R,p1,p2){
  if(!R||!R.lignes.length) return "";
  const nM=nomComplet(G,M.key,M.fi), nS=nomComplet(G,S.key,S.fi).replace(/^TALIS Talis/,"TALIS").replace(/^TALIS TALIS/,"TALIS");
  const nMc=nM.length>22?G.gammes[M.key].label.replace(/^M\. VERTE /,""):nM;
  let h='<div class="cu-dp"><div class="cu-dpt">Vos soins prévus : estimation des remboursements</div>'
    +(CU_CARENCE[S.key]?'<div class="cu-dca">⚠ '+nS+' : '+CU_CARENCE[S.key]+'.</div>':'');
  // Mêmes colonnes que la grille des garanties (Fabrice, 20/10/2026 : « aligner dans les colonnes les remboursements… l'explication
  // verticalement ») : soin · mutuelle · surcomplémentaire · total, une ligne par soin, puis le bilan de l'année dans les mêmes colonnes.
  const C=(c,x)=>'<div class="'+c+'">'+x+'</div>';
  const L4=(a,b,c,d,cls)=>'<div class="cu-r cu-dg'+(cls?' '+cls:'')+'">'+C("cu-l",'<span>'+a+'</span>')+C("cu-a",'<span>'+b+'</span>')+C("cu-b",'<span>'+c+'</span>')+C("cu-t",'<span>'+d+'</span>')+'</div>';
  h+=L4('', '<b>'+nMc+'</b>', '<b>'+nS+'</b>', '<b>Total</b>','cu-dgh');
  for(const l of R.lignes){
    const L=CU_DEPLIB[l.id]||[l.lib,l.lib], r1=l.secu+l.mut;
    // Soin sans base Sécu (lunettes, lentilles, implants, orthodontie non remboursée, chambre) : la Sécurité sociale ne paie
    // rien, tout ce que paient les contrats vient en plus (Fabrice, 20/10/2026 : « ils viennent directement en positif »).
    const sansSecu=!CU_DEP.find(D=>D[0]===l.id)[3];
    h+=L4('<b>'+L[0]+(l.nc?' <sup>†</sup>':'')+'</b><small>'+(l.auto?'forfaits de l’année · ':'')+'coût '+(l.n>1?l.n+' × '+cuE(l.p)+' = ':'')+cuE(l.dep)+(sansSecu?' · non remboursé par la Sécu':'')+'</small>',
      cuE(r1)+(l.secu?'<small>Sécu comprise</small>':'')+(l.atM?'<small class="cu-dpa">plafond atteint</small>':''),
      '+ '+cuE(l.sur)+(l.atS?'<small class="cu-dpa">plafond atteint</small>':''),
      cuE(r1+l.sur)+'<small class="cu-dre">reste '+cuE(l.reste)+'</small>');
  }
  // Bilan de l'année, dans les mêmes colonnes : mutuelle seule · ce qu'ajoute la surcomplémentaire · les deux ensemble.
  const B=cuBilan(R,p1,p2), sg=x=>x==null?'—':(x>0?'+ ':x<0?'− ':'')+cuE(Math.abs(x));
  h+='<div class="cu-blt">Votre bilan sur l’année, pour ces soins</div>';
  h+=L4('', '<b>'+nMc+' seule</b>', '<b>Apport '+nS+'</b>', '<b>Les deux</b>','cu-dgh');
  if(B.tout.cot!=null) h+=L4('Cotisations<sup>1</sup>', cuE(B.mut.cot), sg(B.cotS), cuE(B.tout.cot));
  h+=L4('Remboursements <small>Sécu comprise</small>', cuE(B.mut.rem), sg(B.remS), cuE(B.tout.rem));
  h+=L4('Reste à payer sur ces soins <small>sans complémentaire : '+cuE(B.sans.reste)+'</small>', '<span class="cu-brr">'+cuE(B.mut.reste)+'</span>', sg(-B.remS), '<span class="cu-brr">'+cuE(B.tout.reste)+'</span>');
  if(B.tout.total!=null) h+=L4('<b>Coût réel de l’année</b><small>cotisations + reste</small>', '<b>'+cuE(B.mut.total)+'</b>', '<b>'+sg(-B.plusS)+'</b>', '<b>'+cuE(B.tout.total)+'</b>','cu-dgt');
  // Ligne finale (Fabrice, 20/10/2026) : jamais « TALIS coûte plus qu'il ne rembourse ». Ce que paient les deux contrats (hors
  // Sécurité sociale, qui paierait de toute façon) face aux cotisations de l'année : s'ils remboursent plus, « remboursement
  // excédentaire de x € » ; sinon, ce que la mutuelle et la surcomplémentaire coûtent vraiment par mois, remboursements déduits.
  // Le gain propre à la surcomplémentaire reste affiché au-dessus quand il est positif.
  if(B.plusS!=null&&B.plusS>0) h+='<div class="cu-dgain"><span>Avec '+nS+' : '+cuE(B.remS)+' remboursés en plus pour '+cuE(B.cotS)+' de cotisation</span><b>+ '+cuE(B.plusS)+' pour vous</b></div>';
  if(B.tout.cot!=null){ const remC=cuR(R.mut+R.sur), net=cuR(B.tout.cot-remC);
    h+=net<0
      ?'<div class="cu-dgain cu-dfin"><span>Sur ces seuls soins, vous aurez un remboursement excédentaire de</span><b>'+cuE(-net)+' !</b><small>vos contrats remboursent '+cuE(remC)+' pour '+cuE(B.tout.cot)+' de cotisations (hors Sécurité sociale)</small></div>'
      :'<div class="cu-dgain cu-dfin"><span>Sur ces seuls soins, '+nMc+' et '+nS+' ne vous coûtent que</span><b>'+eur(net/12)+' / mois !</b><small>'+cuE(B.tout.cot)+' de cotisations − '+cuE(remC)+' remboursés par vos contrats (hors Sécurité sociale), sur 12 mois</small></div>'; }
  h+='</div><div class="cu-dn">'+(B.tout.cot!=null?'<sup>1</sup> Les cotisations évoluent chaque année à la date anniversaire du contrat. ':'')
    +'Tableau présenté à titre indicatif — document non contractuel. Prothèses hors panier 100 % Santé (dans le panier 100 % Santé, le reste à charge est nul avec un contrat responsable). Calcul sur les bases de remboursement de l’Assurance maladie (ameli.fr) : prothèse 60 % du tarif de convention (couronne 120 €, bridge 279,50 €, inlay-core 90 €), orthodontie avant 16 ans 100 % de 193,50 € par semestre ; implants, lunettes, lentilles, médecines douces : 0 € de Sécurité sociale ; implants et orthodontie non remboursée au forfait, après les délais d’attente. '+cuPlafTxt(G,M,S,R)
    +(R.nc?' † Garantie non chiffrable : non comptée.':'')+'</div></div>';
  return h;
}
// ---- Comparatif des remboursements entre mutuelles (Fabrice, 20/10/2026 : « la même chose, mais sans TALIS, juste avec 3-4
// mutuelles… ce ne serait pas une addition, juste chaque poste remboursé et le résultat pour chaque compagnie ») : les mêmes soins
// prévus en lignes, une colonne par formule cochée (4 au plus), puis cotisations, remboursements, reste et coût réel de l'année ;
// la formule au coût réel le plus bas est mise en avant. Un poste « au forfait » (médecines douces, pharmacie) vaut, pour toutes
// les colonnes, le plus haut des forfaits comparés : chaque mutuelle rembourse dans son propre forfait.
// o = {cols:[{key,fi}], tarifs:{"CLE|fi":n}, prospect, date, base, depenses:{id:{n,p}|{auto:1}}}
// Postes du comparatif, dans l'ordre dicté par Fabrice (20/10/2026 : « Hospitalisation, Chambre particulière, Honoraires optam,
// Prothèses dentaire, Implants, Paro et endo, Orthodontie, Lunettes verre simple, Verre complexes, Lentilles, Médecine douce,
// Autres »). Toutes les lignes s'affichent, même sans garantie. Paro et endo : aucun poste relevé dans les données — pas de ligne tant qu'il n'est pas relu dans les tableaux.
const CMP_BLOCS=[
  ["Hospitalisation",[["Hospitalisation (honoraires Optam)","hospO",1],["Chambre particulière","ch"],["Consultations spécialistes Optam","honoO"]]],
  ["Dentaire",[["Prothèses dentaires","dent",1],["Implants","x:imp"],["Orthodontie remboursée","x:orthR"],["Orthodontie non remboursée","x:orthN"]]],
  ["Optique",[["Lunettes, verres simples","opt",1],["Lunettes, verres complexes","x:optC"],["Lentilles","x:lentA"]]],
  ["Autres",[["Médecines douces","md"],["Aides auditives","x:aud"],["Pharmacie non remboursée","x:pharN"]]]
];
// Indices des meilleures valeurs d'une ligne, quand toutes se lisent dans la même unité ; [] sinon (ou si toutes sont égales).
function cmpMeilleur(vals){
  // « — » (pas de garantie) compte pour zéro face aux autres ; « n.c. » ou un texte rendent la ligne incomparable.
  const Q=vals.map(v=>String(v).trim()==="—"?"—":cuLire(v)), R=Q.filter(x=>x!=="—");
  if(!R.length||R.some(x=>!x||x.raw)) return [];
  const P=Q.map(x=>x==="—"?{n:0,u:R[0].u,s:R[0].s}:x);
  if(P.some(x=>x.u!==P[0].u||(x.s||"")!==(P[0].s||""))) return [];
  const m=Math.max(...P.map(x=>x.n)); if(P.every(x=>x.n===m)) return [];
  return P.map((x,i)=>x.n===m?i:-1).filter(i=>i>=0);   // ex æquo : toutes en vert
}
function comparatifSoins(G,o){
  o=o||{}; const cols=(o.cols||[]).slice(0,4), tar=o.tarifs||{};
  if(!cols.length) return "";
  // Forfaits « auto » (médecines douces, pharmacie non remboursée) : chaque formule compte son propre forfait, consommé en entier ;
  // une formule qui ne le rembourse pas n'a ni dépense ni reste sur ce poste (Fabrice, 20/10/2026 : « s'il n'est pas remboursé, il
  // n'est pas déduit »). Les autres soins sont la même dépense pour toutes les formules.
  const dep=o.depenses||{}, RS=cols.map(c=>cumulDepenses(G,c,null,dep));
  const ids=CU_DEP.map(L=>L[0]).filter(id=>RS.some(R=>R.lignes.some(l=>l.id===id)));
  const estAuto=id=>RS.some(R=>R.lignes.some(l=>l.id===id&&l.auto));
  const px=cols.map(c=>tar[c.key+"|"+c.fi]), prix=px.every(x=>x!=null);
  const nom=c=>nomComplet(G,c.key,c.fi);
  const C=(cls,x)=>'<div class="'+cls+'"><span>'+x+'</span></div>';
  // Ce que la mutuelle revient à l'année = cotisations annuelles − remboursements de la mutuelle seule ; la Sécurité sociale n'en est
  // jamais déduite (Fabrice, 21/10/2026). Inconnu (cotisation absente, garantie « n.c. ») → null, affiché « À confirmer ».
  const net=RS.map((R,i)=>px[i]!=null&&!R.nc?cuR(px[i]*12-R.mut):null);
  const connus=net.filter(v=>v!=null);
  const best=ids.length&&connus.length?net.indexOf(Math.min(...connus)):-1;
  const AC='<span class="cu-cnr">À confirmer</span>';
  const row=(lab,cells,cls)=>'<div class="cu-cr'+(cls?' '+cls:'')+'" style="grid-template-columns:30% repeat('+cols.length+',1fr)">'+C("cu-l",lab)
    +cells.map((x,i)=>C("cu-cc"+(i===best?" cu-cbest":""),x)).join("")+'</div>';
  let h='<div class="cu-ti">Comparatif de vos remboursements</div>'+(o.prospect?'<div class="cu-pr">'+o.prospect+'</div>':'');
  const fa=R=>cuR(R.lignes.filter(l=>l.auto).reduce((u,l)=>u+l.mut,0));
  // Rappel des besoins saisis, en tête, en bordeaux un peu plus gros (Fabrice, 21/10/2026 : « Rappel des besoins : implantologie
  // 2 000 €, prothèse dentaire 600 €, lunettes 250 € »). Seuls les soins renseignés ; les forfaits comptés d'office n'y sont pas.
  const rap=ids.filter(id=>!estAuto(id)).map(id=>{const l=RS.map(R=>R.lignes.find(x=>x.id===id)).find(Boolean), L=CU_DEPLIB[id]||[id,id];
    return '<span>'+(l.n>1?l.n+' × ':'')+L[0]+'&nbsp;<b>'+cuE(l.dep)+'</b></span>';});
  if(rap.length) h+='<div class="cu-rap"><em>Rappel des besoins :</em><div class="cu-rapl">'+rap.join('')+'</div></div>';
  if(best>=0&&cols.length>1){ const o2=net.filter((v,i)=>i!==best&&v!=null), d=o2.length?Math.min(...o2)-net[best]:0, faB=fa(RS[best]);
    h+='<div class="cu-top"><div class="cu-tg" style="text-align:left;border:0"><b>La plus avantageuse pour ces soins</b><em>'+nom(cols[best])+'</em>'
      +'<span>'+(net[best]>=0?'après ses remboursements, elle vous reviendrait à '+cuE(net[best])+' sur l’année'
        :'pour ces soins, vos remboursements dépasseraient vos cotisations de '+cuE(-net[best]))+(d>0?' · '+cuE(d)+' de mieux que la suivante':'')+'</span>'
      // Les forfaits comptés d'office se disent dans le bandeau : ils ne valent que s'ils sont utilisés.
      +(faB>0?'<span>dont '+cuE(faB)+' si vous utilisez vos forfaits médecines douces et pharmacie</span>':'')
      +'<span class="cu-tnb">La mieux placée pour ces soins, pas forcément la mieux couverte : les garanties sont détaillées plus bas.</span></div></div>'; }
  // En-tête : logo dans une case de hauteur fixe, nom, puis la cotisation mise en avant, alignée en bas de toutes les colonnes
  // (Fabrice, 20/10/2026 : « mettre en avant le tarif du dessus et tout bien aligner les logos et textes »).
  h+=row('',cols.map((c,i)=>'<div class="cu-lg">'+logoEgal(G,c.key,o.base,40,36)+'</div><b>'+nom(c)+'</b>'
    // Le prix annuel n'est plus dans l'en-tête : le bilan, juste dessous, le donne (Fabrice, 21/10/2026 : « retire le 888 € / an »).
    +(px[i]!=null?'<span class="cu-cpx"><em>'+eur(px[i])+'</em> / mois</span>':'')),'cu-ch');
  // Ordre (Fabrice, 21/10/2026 : « fais au mieux mais garde tout sur la même page ») : le bilan juste sous les cotisations — le message
  // principal se lit sans faire défiler —, puis les soins qui le justifient, puis la grille complète des garanties. Rien n'est retiré.
  let hg='', hs='', hb='';
  // Garanties poste par poste (Fabrice, 20/10/2026 : « pourquoi tu n'indiques que 2 postes ? fais un comparatif… ») ; la meilleure
  // valeur de la ligne en vert, seulement quand les valeurs se comparent (même unité).
  hg+='<div class="cu-dpt" style="margin-top:12px">Vos garanties, poste par poste</div>';
  hg+='<div class="cu-leg">% = pourcentage de la base de remboursement de la Sécurité sociale, Sécu comprise · € = forfait · en vert : le mieux disant</div>';
  for(const [bloc,ls] of CMP_BLOCS){
    const rs=ls.map(([lab,src,f])=>[lab,src,f,cols.map(c=>valeur(G,c.key,c.fi,src))]);   // toutes les lignes, même sans garantie (Fabrice, 20/10/2026 : « ajoute les implants dentaires » —
    // FLEXIA Start et GCI 100 n'en ont pas, la ligne disparaissait) : « — » dit au prospect que le poste n'est pas couvert.
    hg+='<div class="cu-csec">'+bloc+'</div>';
    for(const [lab,src,f,vals] of rs){ const m=cmpMeilleur(vals);
      hg+=row(f?'<b>'+lab+'</b>':lab,vals.map((v,i)=>'<span class="cu-cv'+(m.includes(i)?' cu-cvm':'')+'">'+v+'</span>'
        +(src==="dent"&&dentVisibles(G,cols[i].key,cols[i].fi)?'<small>dents visibles : '+dentVisibles(G,cols[i].key,cols[i].fi)+'</small>':'')),f?'cu-cfort':''); }
  }
  if(!ids.length) hs+='<div class="cu-dn">Indiquez les soins prévus (volet « Dépenses ») pour comparer les remboursements.</div>';
  else{
    hs+='<div class="cu-dpt" style="margin-top:12px">Vos soins prévus : détail des remboursements par la mutuelle</div>';
    for(const id of ids){
      const L=CU_DEPLIB[id]||[id,id], D=CU_DEP.find(x=>x[0]===id), sansSecu=!D[3], auto=estAuto(id);
      const l0=RS.map(R=>R.lignes.find(x=>x.id===id)).find(Boolean);
      // « reste 0 € » toujours écrit (Fabrice, 21/10/2026 : « pourquoi n'as-tu pas calculé les prothèses chez Mutuelle Verte ? » —
  // GCI 500 rembourse la couronne en totalité, la case ne montrait que le montant).
  const sous=auto?'forfait de chaque formule, si vous l’utilisez'
        :'coût '+(l0.n>1?l0.n+' × '+cuE(l0.p)+' = ':'')+cuE(l0.dep)+(sansSecu?' · non remboursé par la Sécu':l0.secu?' · Sécu '+cuE(l0.secu):'');
      hs+=row('<b>'+L[0]+'</b><small>'+sous+'</small>',RS.map(R=>{const l=R.lignes.find(x=>x.id===id);
        if(l&&l.nc) return AC;
        if(!l||!(l.mut>0)) return '<span class="cu-cnr">non remboursé</span>'+(l&&!auto?'<small class="cu-dre">reste '+cuE(l.reste)+'</small>':'');
        return '<b class="cu-bv">'+cuE(l.mut)+'</b>'+(auto?'':l.reste>0?'<small class="cu-dre">reste '+cuE(l.reste)+'</small>':'<small class="cu-dr0">reste 0 € · remboursé en totalité</small>')
          +(l.atM?'<small class="cu-dpa">plafond atteint</small>':'')+(l.nc?'<small>† non chiffrable</small>':'');}));
    }
  }
  if(ids.length){
    // Bilan pour un prospect, sans explication orale (Fabrice, 21/10/2026) : ce qu'il paie, ce que la Sécurité sociale et la mutuelle
    // lui rembourseraient (deux lignes distinctes), le total, puis ce que la mutuelle lui reviendrait à. Plus de « Solde » ni de
    // « Montants non remboursés » ici : le reste à régler au praticien est sous chaque soin.
    hb+='<div class="cu-dpt" style="margin-top:10px">Votre bilan sur l’année</div>';
    const eu=(i,f)=>px[i]!=null?f(px[i]):AC;
    hb+=row('Votre cotisation par mois',cols.map((_,i)=>eu(i,x=>'<b>'+eur(x)+'</b>')));
    hb+=row('Vos cotisations sur 12 mois<sup>1</sup>',cols.map((_,i)=>eu(i,x=>'<b>'+cuE(x*12)+'</b>')));
    hb+=row('La Sécurité sociale vous rembourserait',RS.map(R=>'<span class="cu-cn">'+cuE(R.secu)+'</span>'));
    hb+=row('Votre mutuelle vous rembourserait',RS.map(R=>{if(R.nc) return AC;
      return '<b class="cu-bv">'+cuE(R.mut)+'</b>'+(fa(R)>0?'<small>dont '+cuE(fa(R))+' de forfaits, si utilisés</small>':'');}));
    hb+=row('Vous récupéreriez au total',RS.map(R=>R.nc?AC:'<b class="cu-bv">'+cuE(R.secu+R.mut)+'</b>'));
    hb+=row('<b>Après ses remboursements, votre mutuelle vous reviendrait à</b>',net.map(v=>v==null?AC
      :v>=0?'<b class="cu-cn cu-rev">'+cuE(v)+'</b><small>sur l’année</small>'
      :'<b class="cu-cn cu-rev">0 €</b><small>pour ces soins, vos remboursements dépasseraient vos cotisations de '+cuE(-v)+'</small>'),'cu-ctot');
    hb+='<div class="cu-res">Estimation pour les soins renseignés, sous réserve des conditions, plafonds et délais d’attente du contrat.</div>';
  }
  h+=hb+hs+hg;
  const plaf=cols.map((c,i)=>{const P=RS[i].plafM; return nom(c)+' : '+(!P?'pas de plafond dentaire':P.m==null?'plafond '+P.nc:cuNb(P.m)+' € par an');});
  h+='<div class="cu-dn">'+(prix?'<sup>1</sup> Les cotisations évoluent chaque année à la date anniversaire du contrat. ':'')
    +'Tableau présenté à titre indicatif — document non contractuel. Les forfaits (implants, lunettes, lentilles, médecines douces…) sont remboursés dans la limite de la dépense réelle, jamais au-delà. Pourcentages Sécurité sociale comprise, sur les bases de remboursement de l’Assurance maladie (ameli.fr) : prothèse 60 % du tarif de convention (couronne 120 €, bridge 279,50 €, inlay-core 90 €), orthodontie avant 16 ans 100 % de 193,50 € par semestre ; implants, lunettes, lentilles, médecines douces : 0 € de Sécurité sociale ; prothèses hors panier 100 % Santé ; implants et orthodontie non remboursée au forfait, après les délais d’attente. Plafonds dentaires (1re année d’adhésion, appliqués) — '+plaf.join(' ; ')+'.'
    +(o.date?' Tarifs au '+o.date+', valables '+VALIDITE+' jours.':'')+'</div>'
    +'<div class="cu-mq">'+marque(o.base)+'<span>Courtier comparateur depuis 1992 · Infos légales : www.santeo.net</span></div>';
  return '<div class="cumul cu-cmp">'+h+'</div>';
}
// o = {mut:{key,fi}, sur:{key,fi}, tarifs:{"CLE|fi":n}, prospect, date:"jj/mm/aaaa", base, sansTarifs, depenses:{id:{n,p}}}
function cumul(G,o){
  o=o||{};
  const M=o.mut,S=o.sur,v1=src=>valeur(G,M.key,M.fi,src),v2=src=>valeur(G,S.key,S.fi,src);
  const nS=nomComplet(G,S.key,S.fi).replace(/^TALIS Talis/,"TALIS").replace(/^TALIS TALIS/,"TALIS");
  const p1=(o.tarifs||{})[M.key+"|"+M.fi], p2=(o.tarifs||{})[S.key+"|"+S.fi], prix=!o.sansTarifs&&p1!=null&&p2!=null;
  const cell=(c,h)=>'<div class="'+c+'">'+h+'</div>';
  const ligne=(c0,a,b,c,cls)=>'<div class="cu-r'+(cls?" "+cls:"")+'">'+cell("cu-l",c0)+cell("cu-a",a)+cell("cu-b",b)+cell("cu-t",c)+'</div>';
  const ch=CU_GAINS.filter(([s])=>cuLire(v2(s))).map(([s,l])=>'<span><i>'+l+'</i> '+cuPlus(v2(s))+'</span>').join("");
  let h='<div class="cu-ti">Votre mutuelle + surcomplémentaire</div>'
    +(o.prospect?'<div class="cu-pr">'+o.prospect+'</div>':'');
  // Première ligne (Fabrice, 20/10/2026 : « afficher les gains de la solution en première ligne », « une composition des deux »,
  // puis la critique relue ensemble) : le reste à payer sur les soins, hors cotisations, comparé à « sans complémentaire » ; à côté,
  // seulement s'il est positif, ce que la surcomplémentaire fait gagner (remboursé en plus − sa cotisation) — même calcul que le bilan.
  const RD=o.depenses?cumulDepenses(G,M,S,o.depenses):null;
  if(RD&&RD.lignes.length){ const B=cuBilan(RD,prix?p1:null,prix?p2:null);
    h+='<div class="cu-top"><div class="cu-tr"><b>Reste à payer sur vos soins</b><em>'+cuE(RD.reste)+'</em>'
      +'<span>au lieu de <i>'+cuE(RD.dep-RD.secu)+'</i> sans complémentaire · hors cotisations</span></div>'
      +(B.plusS!=null&&B.plusS>0?'<div class="cu-tg"><b>Avec '+nS+'</b><em>+ '+cuE(B.plusS)+'</em><span>'+cuE(B.remS)+' remboursés en plus pour '+cuE(B.cotS)+' de cotisation</span></div>':'')
      +'</div>'; }
  // Le bandeau « Pour x € de plus par mois… » ferme le tableau, juste au-dessus de la cotisation (Fabrice, 20/10/2026).
  const gain=ch?'<div class="cu-gain">'+(prix?'Pour <b>'+eur(p2)+' de plus par mois</b>, ':'')+nS+' renforce vos remboursements :<div class="cu-chips">'+ch+'</div></div>':'';
  h+='<div class="cu-r cu-h">'+cell("cu-l","")
    +cell("cu-a",'<div class="cu-lg">'+logoEgal(G,M.key,o.base,40,36)+'</div><b>'+nomComplet(G,M.key,M.fi)+'</b><i class="cu-rf"></i><span class="cu-ro">Mutuelle principale</span>')
    +cell("cu-b",'<div class="cu-lg">'+logoEgal(G,S.key,o.base,40,36)+'</div><b>'+nS+'</b><i class="cu-rf">Renfort</i><span class="cu-ro">Surcomplé&shy;mentaire</span>')
    +cell("cu-t",'<div class="cu-lg cu-eg">=</div><b>Total cumulé</b><i class="cu-rf"></i><span class="cu-ro">Mutuelle + Surcompl.</span>')+'</div>';
  h+='<div class="cu-leg">% = pourcentage de la base de remboursement de la Sécurité sociale, Sécu comprise · € = forfait</div>';
  const notes=[];
  for(const [bloc,ls] of BLOCS){
    const rs=ls.filter(([,src])=>CU_POSTES[src]&&(v1(src)!=="—"||v2(src)!=="—"));
    if(!rs.length)continue;
    h+=ligne(bloc,"","","","cu-sec");
    for(const [,src] of rs){const plus=!!cuLire(v2(src));
      let tt=cumulTotal(v1(src),v2(src));
      const ast=CU_AST[src];
      if(ast){const a=cuDef(ast.T,G,M,v1(src)),b=cuDef(ast.T,G,S,v2(src)),l=[a,b].filter(Boolean);
        if(l.length){const n="*".repeat(notes.length+1);
          tt='<span>'+tt+'<sup class="cu-ast">'+n+'</sup></span>';
          notes.push('<sup>'+n+'</sup> '+ast.titre+' — '+l.map(x=>x.txt).join(" ; ")+"."+(a&&b?ast.fin(a,b):""));}}
      const dv=src==="dent"?dentVisibles(G,M.key,M.fi):"";
      h+=ligne(CU_POSTES[src],v1(src)+(dv?'<small>dents visibles : '+dv+'</small>':''),cuPlus(v2(src)),tt,plus?"cu-up":"");}
  }
  h+=ligne("","","","","cu-fin");
  // Cotisation juste sous le tableau, puis le bandeau TALIS, puis les explications (Fabrice, 20/10/2026 : « remonte les
  // tarifs au dessous du tableau avant les explications »).
  if(prix) h+='<div class="cu-r cu-prix">'+cell("cu-l",'Cotisation<small>par mois</small>')
    +cell("cu-a",'<span class="cu-n">'+eur(p1)+'</span><small>'+G.gammes[M.key].names[M.fi]+'</small>')
    +cell("cu-b",'<span class="cu-n">+ '+eur(p2)+'</span><small>'+nS+'</small>')
    +cell("cu-t",'<span class="cu-n">'+eur(p1+p2)+'</span><small>total / mois</small>')+'</div>';
  if(RD) h+=cuDepHTML(G,M,S,RD,prix?p1:null,prix?p2:null);
  h+=gain;
  if(notes.length) h+='<div class="cu-nb">'+notes.join('<br>')+'</div>';
  const gM=G.gammes[M.key], nr=gM&&(gM.resp===false||/^\s*Contrat NON responsable/i.test(String(limites(G,M.key,M.fi)||"")));
  const note=CU_NOTE[S.key]?CU_NOTE[S.key](S.fi):"";
  h+='<div class="cu-ft"><b>'+nS+'</b> s’ajoute à votre mutuelle, sans la remplacer'+(note?" ; "+note:"")+'.'
    +(nr?' <b>'+nomComplet(G,M.key,M.fi)+'</b> : contrat non responsable.':'')
    +' Pourcentages Sécurité sociale comprise ; jamais plus que la dépense réelle.'
    +(o.date?' Tarifs au '+o.date+', valables '+VALIDITE+' jours.':'')+'</div>'
    +'<div class="cu-mq">'+marque(o.base)+'<span>Courtier comparateur depuis 1992 · Infos légales : www.santeo.net</span></div>';
  return '<div class="cumul">'+h+'</div>';
}

exporter.POSTES=POSTES;
exporter.BLOCS=BLOCS;
exporter.ATOUTS=ATOUTS;
exporter.LOGOBASE=LOGOBASE;
exporter.valeur=valeur;
exporter.affiche=affiche;
exporter.dentVisibles=dentVisibles;
exporter.logo=logo;
exporter.marque=marque;
exporter.legal=legal;
exporter.LEGAL=LEGAL;
exporter.VALIDITE=VALIDITE;
exporter.baseDevis=baseDevis;
exporter.piedCourt=piedCourt;
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
exporter.cumul=cumul;
exporter.cumulTotal=cumulTotal;
exporter.cumulDepenses=cumulDepenses;
exporter.comparatifSoins=comparatifSoins;
exporter.CU_DEP=CU_DEP;

})(typeof module!=="undefined"&&module.exports ? module.exports
   : ((typeof self!=="undefined"?self:this).Tableau={}));
