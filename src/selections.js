/* Sélections fixes de garanties, sans tarif, pour les images envoyées par le CRM.
 *
 * Le CRM envoie, juste après le « oui » du prospect à « je vous les présente ? », une
 * image du tableau de garantie SANS TARIF. Sans tarif, l'image ne dépend que du besoin :
 * elle est la même pour tous les prospects d'un même niveau. Ce module choisit les
 * formules ; tools/images_tg.js en fait les images et docs/tg/index.json.
 *
 * Règles de Fabrice (27/09/2026, confirmées le même jour) :
 *  - première colonne, toujours : Cap Évolution Accès ;
 *  - ensuite une colonne par compagnie, jamais deux fois le même logo (le prospect
 *    croirait qu'il n'y en a qu'une), dans l'ordre MCCI, Mutuelle Verte, Révoluo (REMA),
 *    APICIL — Cap Évolution est déjà en tête ; jusqu'à 5 colonnes ;
 *  - pour chaque compagnie, la formule la MOINS CHÈRE qui atteint le niveau ; au niveau 4,
 *    la plus forte ; une compagnie qui n'atteint pas le niveau est laissée de côté ;
 *  - niveaux (besoin le plus fort de la fiche) : 1 = 100 %, 2 = 150 %, 3 = 200 %,
 *    4 = 300 % ; l'optique suit la même échelle en euros ;
 *  - sans besoin exprimé : une échelle en hospitalisation qui part de Cap Évolution
 *    Accès 100 % et monte d'une compagnie à l'autre.
 *
 * Lecture retenue :
 *  - « atteint le niveau » = au moins le seuil du niveau (131 % au niveau 2 : Cap Évolution
 *    Tranquillité, à 160 %, compte pour le niveau 2) ;
 *  - MCCI = FLEXIA (MCCINOVA n'est pas responsable et n'a presque pas de dentaire) ;
 *  - APICIL = Équilibre 1 à 6 (Sérénité est réservée aux plus de 50 ans) ;
 *  - « 100 % BR » ou « 100 % » en optique n'est pas un forfait en euros et ne compte pas ;
 *  - hospitalisation = honoraires au parcours OPTAM (ligne « Hospitalisation Optam »).
 *
 * Fonction pure, sans DOM ni réseau : navigateur (window.Selections) et Node.
 */
(function(exporter){
"use strict";

// En tête, toujours : Cap Évolution Accès.
const TETE={key:"CAPEVO", fi:0};

// Puis une compagnie par colonne, dans cet ordre.
const ORDRE=[
  {key:"FLEXIA"},
  {key:"MV"},
  {key:"REV"},
  {key:"APICIL", formules:[0,1,2,3,4,5]}   // Équilibre 1 à 6
];

const MAX_COLONNES=5;

const BESOINS={
  dentaire:       {src:"dent",  unite:"%", libelle:"Prothèses dentaires"},
  optique:        {src:"opt",   unite:"€", libelle:"Verres et monture simples"},
  hospitalisation:{src:"hospO", unite:"%", libelle:"Hospitalisation Optam"}
};

// Seuil d'entrée de chaque niveau.
const SEUILS=[1,131,200,300];

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
  return {key:key, fi:fi, compagnie:(G.compagnies||{})[key]||"", logo:g.logo||g.ins,
          gamme:g.label, formule:g.names[fi],
          nom:(g.label+" "+g.names[fi]).replace(/(^|\s)(\S+) \2(?=\s|$)/,"$1$2"),
          valeur:(g[src]||[])[fi], responsable:g.resp!==false};
}

// Une compagnie, un besoin, un niveau : la formule retenue, ou null.
// Les formules d'une gamme vont de la moins chère à la plus chère.
function choisir(G,o,besoin,niveau){
  const b=BESOINS[besoin], seuil=SEUILS[niveau-1], g=G.gammes[o.key]; if(!g) return null;
  const val=i=>lire((g[b.src]||[])[i],b.unite);
  const ok=formulesDe(G,o).filter(i=>{const x=val(i);return x!==null&&x>=seuil;});
  if(!ok.length) return null;
  if(niveau===4){
    let best=ok[0];
    for(const i of ok) if(val(i)>val(best)) best=i;
    return best;
  }
  return ok[0];
}

// Ajoute une colonne si son logo n'y est pas encore et s'il reste de la place.
function ajouter(cols,col){
  if(cols.length>=MAX_COLONNES) return false;
  if(cols.some(c=>c.logo===col.logo)) return false;
  cols.push(col); return true;
}

// Sans besoin : Cap Évolution Accès, puis pour chaque compagnie suivante la première
// formule strictement au-dessus de la précédente, en hospitalisation OPTAM.
function echelle(G){
  const src=BESOINS.hospitalisation.src, cols=[colonne(G,TETE.key,TETE.fi,src)];
  let seuil=lire(G.gammes[TETE.key][src][TETE.fi],"%");
  for(const o of ORDRE){
    const g=G.gammes[o.key]; if(!g) continue;
    const i=formulesDe(G,o).find(i=>{const x=lire((g[src]||[])[i],"%");return x!==null&&x>seuil;});
    if(i===undefined) continue;
    if(ajouter(cols,colonne(G,o.key,i,src))) seuil=lire(g[src][i],"%");
  }
  return cols;
}

function selections(G){
  const out=[];
  for(const besoin of Object.keys(BESOINS)){
    const src=BESOINS[besoin].src;
    for(let n=1;n<=4;n++){
      const cols=[colonne(G,TETE.key,TETE.fi,src)];
      for(const o of ORDRE){
        const fi=choisir(G,o,besoin,n);
        if(fi!==null) ajouter(cols,colonne(G,o.key,fi,src));
      }
      out.push({id:besoin+"-"+n, besoin:besoin, niveau:n, ligne:BESOINS[besoin].libelle, formules:cols});
    }
  }
  out.push({id:"sans-besoin", besoin:null, niveau:null, ligne:BESOINS.hospitalisation.libelle, formules:echelle(G)});
  return out;
}

exporter.TETE=TETE;
exporter.ORDRE=ORDRE;
exporter.BESOINS=BESOINS;
exporter.SEUILS=SEUILS;
exporter.lire=lire;
exporter.selections=selections;

})(typeof module!=="undefined"&&module.exports ? module.exports
   : ((typeof self!=="undefined"?self:this).Selections={}));
