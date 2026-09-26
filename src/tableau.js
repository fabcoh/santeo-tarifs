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
const POSTES=[["Hospitalisation Optam","hospO"],["Hospitalisation hors Optam","hospN"],["Chambre particulière","ch"],["Consult. spécialistes Optam","honoO"],["Consult. hors Optam","honoN"],["Dentaire — prothèses","dent"],["Implantologie","x:imp"],["Orthodontie remboursée","x:orthR"],["Orthodontie non remboursée","x:orthN"],["Optique (équipement)","opt"],["Lentilles acceptées","x:lentA"],["Lentilles refusées","x:lentR"],["Aides auditives","x:aud"],["Médecine douce / bien-être","md"]];

// Postes mis en avant sous le tableau pour la formule conseillée. Hospitalisation
// et honoraires au parcours OPTAM : le cas courant, et le seul comparable d'une
// compagnie à l'autre.
const ATOUTS=[["hospitalisation","hospO"],["honoraires spécialistes","honoO"],
  ["chambre particulière","ch"],["dentaire","dent"],["implantologie","x:imp"],
  ["orthodontie","x:orthR"],["optique","opt"],["lentilles","x:lentA"],
  ["aides auditives","x:aud"],["médecines douces","md"]];

// Logos déposés dans docs/ (PNG à fond transparent, hauteur utile ~40 px).
const LOGOS={mcci:"logo_mcci.png",avenir:"logo_avenir.png",mverte:"logo_mverte.png",apicil:"logo_apicil.png"};
const LOGOBASE="https://fabcoh.github.io/santeo-tarifs/docs/";

const eur=v=>v==null?"—":v.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";

// « M. VERTE GCI » + « GCI 100 » donne « M. VERTE GCI GCI 100 » : on ôte la répétition.
function nomComplet(G,key,fi){
  return (G.gammes[key].label+" "+G.gammes[key].names[fi]).replace(/\b(\S+) \1\b/,"$1");
}

function valeur(G,key,fi,src){
  const f=G.gammes[key], e=(G.extras||{})[key]||{};
  if(src.startsWith("x:")){const k=src.slice(2);return (e[k]&&e[k][fi]!==undefined)?e[k][fi]:"—";}
  const arr=f&&f[src];return (arr&&arr[fi]!==undefined)?arr[fi]:"—";
}

// Tant qu'un logo manque, le nom de la compagnie s'affiche à sa place : rien ne casse.
function logo(G,key,base){
  const g=G.gammes[key], f=g&&LOGOS[g.ins], nom=(G.compagnies||{})[key]||"";
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

// Les indemnités journalières n'ont de sens que si l'une des formules en verse.
function lignes(G,cols){
  const ij=cols.some(c=>{const v=valeur(G,c.key,c.fi,"ij");return v&&v!=="—";});
  return (ij?[["Indemnités journalières hospitalisation","ij"]]:[]).concat(POSTES);
}

function entete(G,cols,reco,o){
  o=o||{};
  const multi=cols.some(c=>c.key!==cols[0].key);
  return '<tr><th></th>'+cols.map((c,ci)=>'<th class="pick'+(estReco(reco,c)?' reco':'')+'" data-ci="'+ci+'">'
    +celluleEntete(G,c,{reco:estReco(reco,c),multi:multi,base:o.base,
                        tarif:o.tarifs?o.tarifs[c.key+"|"+c.fi]:undefined})
    +'</th>').join('')+'</tr>';
}

function corps(G,cols,reco){
  return lignes(G,cols).map(([lab,src])=>'<tr><td>'+lab+'</td>'
    +cols.map(c=>'<td'+(estReco(reco,c)?' class="reco"':'')+'>'+valeur(G,c.key,c.fi,src)+'</td>').join('')
    +'</tr>').join('');
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
  if(/^Notice/i.test(k)) return "Notice";
  if(/notice/i.test(k)) return "Tableau de garantie + notice";
  if(/IPID/.test(k)) return "Garanties + IPID";
  return "Tableau de garantie";
}

// Documents de la formule affichée. Une adresse vaut pour toute la gamme ; un tableau
// est indexé sur la formule, pour les documents qui en dépendent — APICIL publie une
// plaquette par gamme Équilibre et une seule pour toutes les Sérénité, et l'IPID de
// La Mutuelle Verte ne couvre que GCI 500. Un document absent n'apparaît pas.
function documents(G,key,fi){
  const d=(G.documents||{})[key]; if(!d) return [];
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
function pied(G,cols,note,reco){
  const c=cols.find(x=>estReco(reco,x));
  const av=c?atouts(G,c.key,c.fi):"";
  const blocs=cols.map(x=>{
    const g=G.gammes[x.key]; if(!g) return "";
    const liens=documents(G,x.key,x.fi)
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
    +'<div class="foot">'+pied(G,o.cols,o.note,o.reco)+'</div>';
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
exporter.ATOUTS=ATOUTS;
exporter.LOGOBASE=LOGOBASE;
exporter.valeur=valeur;
exporter.logo=logo;
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
