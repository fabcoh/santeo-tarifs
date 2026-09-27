/* Sélections fixes de garanties, sans tarif, pour les images envoyées par le CRM.
 *
 * Le CRM envoie, juste après le « oui » du prospect à « je vous les présente ? », une
 * image du tableau de garantie SANS TARIF. Sans tarif, l'image ne dépend que du besoin :
 * elle est la même pour tous les prospects d'un même niveau. Ce module choisit les
 * formules ; tools/images_tg.js en fait les images et docs/tg/index.json.
 *
 * Règles de Fabrice (27/09/2026) :
 *  - une formule par compagnie, dans cet ordre : Avenir Cap Évolution, MCCI, Mutuelle
 *    Verte, Avenir Révoluo, APICIL ; de 3 à 5 par image ;
 *  - le niveau suit le besoin le plus fort de la fiche (1 à 4) : 1 = 100 à 130 %,
 *    2 = 150 %, 3 = 200 à 250 %, 4 = 300 à 500 % (le plus fort de chaque compagnie) ;
 *  - une compagnie sans formule au niveau demandé est laissée de côté, jamais remplacée ;
 *  - sans besoin exprimé : une échelle en hospitalisation qui part de Cap Évolution
 *    Accès 100 % et monte d'une compagnie à l'autre.
 *
 * Lecture retenue ici, à faire valider :
 *  - les niveaux se touchent (1 : jusqu'à 130, 2 : 131 à 199, 3 : 200 à 299, 4 : 300 et
 *    plus) : sinon Cap Évolution Tranquillité (160 %) ne serait d'aucun niveau ;
 *  - aux niveaux 1 à 3, la PREMIÈRE formule de la compagnie qui atteint le niveau (la
 *    moins chère qui répond au besoin) ; au niveau 4, la plus forte ;
 *  - MCCI = FLEXIA (MCCINOVA n'est pas responsable et n'a presque pas de dentaire) ;
 *  - APICIL = Équilibre 1 à 6 (Sérénité est réservée aux plus de 50 ans) ;
 *  - optique en euros, même échelle que les pourcentages (100 / 150 / 200-250 / 300 €) ;
 *    « 100 % BR » ou « 100 % » n'est pas un forfait et ne compte pour aucun niveau ;
 *  - hospitalisation = honoraires au parcours OPTAM (ligne « Hospitalisation Optam »).
 *
 * Fonction pure, sans DOM ni réseau : navigateur (window.Selections) et Node.
 */
(function(exporter){
"use strict";

const ORDRE=[
  {key:"CAPEVO"},
  {key:"FLEXIA"},
  {key:"MV"},
  {key:"REV"},
  {key:"APICIL", formules:[0,1,2,3,4,5]}   // Équilibre 1 à 6
];

const BESOINS={
  dentaire:       {src:"dent",  unite:"%", libelle:"Dentaire — prothèses"},
  optique:        {src:"opt",   unite:"€", libelle:"Optique (équipement)"},
  hospitalisation:{src:"hospO", unite:"%", libelle:"Hospitalisation Optam"}
};

// [minimum, maximum] de chaque niveau, bornes comprises.
const NIVEAUX=[[1,130],[131,199],[200,299],[300,Infinity]];

// « 150 % » → 150 en %, « 230 € » → 230 en € ; « 100 % BR », « — » → rien.
function lire(v,unite){
  const s=String(v==null?"":v).trim();
  const m=s.match(/^(\d+(?:[.,]\d+)?)\s*(%|€)$/);
  if(!m||m[2]!==unite) return null;
  return parseFloat(m[1].replace(",","."));
}

function formulesDe(G,o){
  const g=G.gammes[o.key]; if(!g) return [];
  return (o.formules||g.names.map((_,i)=>i)).filter(i=>i<g.names.length);
}

function colonne(G,key,fi,src){
  const g=G.gammes[key];
  return {key:key, fi:fi, gamme:g.label, formule:g.names[fi],
          nom:(g.label+" "+g.names[fi]).replace(/(^|\s)(\S+) \2(?=\s|$)/,"$1$2"),
          valeur:(g[src]||[])[fi], responsable:g.resp!==false};
}

// Une compagnie, un besoin, un niveau : la formule retenue, ou null.
function choisir(G,o,besoin,niveau){
  const b=BESOINS[besoin], [lo,hi]=NIVEAUX[niveau-1], g=G.gammes[o.key]; if(!g) return null;
  const dedans=formulesDe(G,o).filter(i=>{const x=lire((g[b.src]||[])[i],b.unite);return x!==null&&x>=lo&&x<=hi;});
  if(!dedans.length) return null;
  if(niveau===4){
    // La plus forte ; à valeur égale, la première.
    let best=dedans[0];
    for(const i of dedans) if(lire(g[b.src][i],b.unite)>lire(g[b.src][best],b.unite)) best=i;
    return best;
  }
  return dedans[0];
}

// Sans besoin : Cap Évolution Accès, puis pour chaque compagnie suivante la première
// formule strictement au-dessus de la précédente, en hospitalisation OPTAM.
function echelle(G){
  const src=BESOINS.hospitalisation.src, cols=[]; let seuil=-1;
  for(const o of ORDRE){
    const g=G.gammes[o.key]; if(!g) continue;
    const i=formulesDe(G,o).find(i=>{const x=lire((g[src]||[])[i],"%");return x!==null&&x>seuil;});
    if(i===undefined) continue;
    cols.push(colonne(G,o.key,i,src)); seuil=lire(g[src][i],"%");
  }
  return cols;
}

function selections(G){
  const out=[];
  for(const besoin of Object.keys(BESOINS)){
    for(let n=1;n<=4;n++){
      const cols=[];
      for(const o of ORDRE){
        const fi=choisir(G,o,besoin,n);
        if(fi!==null) cols.push(colonne(G,o.key,fi,BESOINS[besoin].src));
      }
      out.push({id:besoin+"-"+n, besoin:besoin, niveau:n, ligne:BESOINS[besoin].libelle, formules:cols});
    }
  }
  out.push({id:"sans-besoin", besoin:null, niveau:null, ligne:BESOINS.hospitalisation.libelle, formules:echelle(G)});
  return out;
}

exporter.ORDRE=ORDRE;
exporter.BESOINS=BESOINS;
exporter.NIVEAUX=NIVEAUX;
exporter.lire=lire;
exporter.selections=selections;

})(typeof module!=="undefined"&&module.exports ? module.exports
   : ((typeof self!=="undefined"?self:this).Selections={}));
