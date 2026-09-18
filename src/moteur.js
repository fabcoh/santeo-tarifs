/* Moteur de tarification du comparateur Santéo.
 *
 * Même code pour la page et pour un serveur Node : le comparateur public et le CRM
 * WhatsApp doivent annoncer le même tarif au même prospect, or deux implémentations
 * finissent toujours par diverger.
 *
 * Le moteur est une fonction pure : il ne lit aucun champ, ne dessine rien et
 * n'appelle jamais le réseau. Les tarifs API SANTÉ, qui viennent d'un appel à
 * l'assureur, lui sont remis tout faits par l'appelant.
 *
 *   const {rows, warns} = Moteur.calculer({
 *     D,            // src/tarifs_all.json
 *     F,            // garanties par formule (garanties.json → gammes)
 *     sel,          // {MCCINOVA:false, …} — aucune coche = toutes les gammes
 *     age, cnjAge, hasCnj, kids,          // âges atteints dans l'année
 *     reg,          // SAL | TNS | RL | TNSRL
 *     dept, zone,   // Moteur.departement(cp) et Moteur.zones(D)[dept]
 *     apicil,       // {profil, etat:"ok|attente|erreur", tarifs, message, approche, cpExact}
 *   });
 *
 * Navigateur : window.Moteur.   Node : require("./moteur.js").
 */
(function(exporter){
"use strict";

const eur=v=>v==null?"—":v.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";

// Codes des formules API Santé, dans l'ordre d'affichage de la gamme APICIL.
const CODES_APICIL=["siApiSanteEquilibre1","siApiSanteEquilibre2","siApiSanteEquilibre3","siApiSanteEquilibre4","siApiSanteEquilibre5","siApiSanteEquilibre6","siApiSanteSerenite1","siApiSanteSerenite2","siApiSanteSerenite3","siApiSanteSerenite4","siApiSanteSerenite5"];

function parseAge(s,YEAR){
  YEAR=YEAR||new Date().getFullYear();
  s=(s||"").trim(); if(!/^\d{1,4}$/.test(s)) return null;
  const n=+s;
  if(n>=1900&&n<=YEAR) return YEAR-n;
  if(n>=0&&n<=110) return n;
  return null;
}
function deptOf(s){
  s=(s||"").trim().toUpperCase();
  if(s==="2A"||s==="2B") return s;
  if(/^\d{4,5}$/.test(s)){ // tolère un code postal complet
    if(s.length===4) s="0"+s;
    if(s.startsWith("97")) return s.slice(0,3);
    if(s.startsWith("20")) return (+s<=20190?"2A":"2B");
    return s.slice(0,2);
  }
  if(/^97\d$/.test(s)) return s;
  if(/^\d{1,2}$/.test(s)){ s=s.padStart(2,"0"); return s==="20"?"2A":s; }
  return null;
}

// Département → zone MCCI, d'après les zones de src/tarifs_all.json.
function zones(D){
  const z={};
  for(const[n,s]of Object.entries(D.ZONES)) s.split(" ").forEach(d=>z[d]=+n);
  return z;
}

function calculer(e){
  const D=e.D, F=e.F, sel=e.sel||{}, api=e.apicil||{};
  const age=e.age, cnjAge=e.cnjAge, hasCnj=!!e.hasCnj, kids=+e.kids||0;
  const reg=e.reg||"SAL", dept=e.dept||null, zone=e.zone||null;
  // aucune coche = toutes les gammes ; coche(s) = uniquement celles-là
  const on=k=>Object.values(sel).some(v=>v)?sel[k]:true;
  const rows=[],warns=[];
  if(age==null) return {rows,warns};
  const isRL=(reg==="RL"||reg==="TNSRL"), isTNS=(reg==="TNS"||reg==="TNSRL");
  const chMadelin=isTNS?[["info","Madelin à confirmer"]]:[];

  function push(key,fi,suffix,chips,pA,pC,pK,kidNote,incomplete){
    const total=Math.round((pA+(pC||0)+(pK||0))*100)/100,f=F[key];
    rows.push({key,fi,ins:f.ins,resp:f.resp,gamme:f.label+(suffix||""),formule:f.names[fi],
      hospO:f.hospO[fi],hospN:f.hospN[fi],honoO:f.honoO[fi],honoN:f.honoN[fi],
      dent:f.dent[fi],opt:f.opt[fi],aud:f.aud[fi],ch:f.ch[fi],md:f.md[fi],
      chips,pA,pC,pK,kidNote,total,incomplete:!!incomplete});
  }
  function mcci(key,suffix,grid,chips,minA,maxA,childPrice,childLabel){
    if(isRL||!on(key))return;
    if(age<minA||age>maxA){warns.push(F[key].label+" : non éligible à "+age+" ans (grille "+minA+"–"+maxA+" ans).");return}
    for(let i=0;i<F[key].names.length;i++){
      const pA=grid[age][i];
      let pC=null,cW=false;
      if(hasCnj&&cnjAge!=null){ if(cnjAge>=minA&&cnjAge<=maxA)pC=grid[cnjAge][i]; else cW=true; }
      let pK=null,kidNote="";
      if(kids>0){ if(childPrice){pK=Math.round(childPrice[i]*kids*100)/100;kidNote=kids+" × "+eur(childPrice[i])+(childLabel?" — "+childLabel:"");} else kidNote="pas de tarif enfant publié"; }
      push(key,i,suffix,chips.slice(),pA,hasCnj?(cW?undefined:pC):null,pK,kidNote,(hasCnj&&cW)||(kids>0&&pK==null));
    }
  }
  mcci("MCCINOVA","",D.MCCINOVA,[["nr","Non responsable"]].concat(chMadelin),18,90,D.MCCINOVA["18"],"tarif 18 ans");
  if(zone){
    mcci("FLEXIA","",D.FLEXIA[zone],[["resp","Responsable"]].concat(chMadelin),18,84,D.FLEXIA[zone]["E"]);
    mcci("SOLENCIA","",D.SOLENCIA[zone],[["resp","Responsable"]],62,99,D.SOLENCIA[zone]["E"]);
  } else if(!isRL) warns.push("Code postal manquant ou hors zonage : FLEXIA et SOLENCIA non calculées.");
  // CAP EVOLUTION — bloc par régime
  if(on("CAPEVO")&&age>=16){
    const g=D.CAPEVO[reg];
    const a=String(Math.min(Math.max(age,16),100));
    for(let i=0;i<4;i++){
      const pA=g[a][i*2];
      let pC=null;
      if(hasCnj&&cnjAge!=null&&cnjAge>=16)pC=g[String(Math.min(Math.max(cnjAge,16),100))][i*2+1];
      const kp=g["15"][i*2],kn=Math.min(kids,2);
      const pK=kids>0?kp*kn:null;
      push("CAPEVO",i,isTNS?" TNS":(isRL?" RL":""),[["resp","Responsable"]],pA,hasCnj?pC:null,pK,
        kids>0?(kn+" × "+eur(kp)+(kids>2?" (3ᵉ+ gratuit)":"")):"",false);
    }
  }
  // CAP NR — tarif unique salarié/TNS, colonne RL sinon zone AVENIR
  if(on("CAPNR")){
    const g=D.CAPNR;
    const c=isRL?0:(dept&&D.AVZ[dept]?D.AVZ[dept]:null);
    if(c===null){ if(!isRL) warns.push("CAP NR : code postal requis pour le zonage AVENIR."); }
    else if(age>=16&&age<=100){
      const a=String(age);
      for(let f=0;f<7;f++){
        const pA=g[a][f*8+c*2];
        let pC=null;
        if(hasCnj&&cnjAge!=null&&cnjAge>=16)pC=g[String(Math.min(Math.max(cnjAge,16),100))][f*8+c*2+1];
        const kp=g["15"][f*8+c*2],kn=Math.min(kids,2);
        const pK=kids>0?kp*kn:null;
        push("CAPNR",f,"",[["nr","Non responsable"]].concat(isTNS?[["info","Tarif unique sal./TNS"]]:[]),
          pA,hasCnj?pC:null,pK,kids>0?(kn+" × "+eur(kp)+(kids>2?" (3ᵉ+ gratuit)":"")):"",false);
      }
    }
  }
  // REVOLUO — base salarié × zone × régime (Alsace ×0,65 sans zone). Première ligne de grille = 18 ans (âge atteint dans l'année) ;
  // les mineurs sont tarifés comme un 18 ans (2 payants max) ; un mineur ou un 18 ans saisi en adulte donne le même tarif.
  if(on("REV")||on("RF50")||on("RF100")){
    const RZC={1:1,2:0.95,3:0.90,4:0.85,5:0.80};
    const rz=dept?D.RVZ[dept]:null;
    const isDom=dept&&dept.length===3;
    const nAd=1+((hasCnj&&cnjAge!=null)?1:0), nPers=nAd+kids;
    const fam=(nAd===2||nPers>=3)?0.90:(nAd===1&&kids===1)?0.95:1;
    const r2=v=>Math.round(v*100)/100;
    // Alignement sur le tarificateur showcase (vérifié RF100 18 ans, 5 valeurs sur 5) : grille × 0,999 arrondie au centime
    const RVALIGN=0.999;
    const coef=isRL?0.65:(rz?RZC[rz]*(isTNS?0.90:1):null);
    if(isDom) warns.push("REVOLUO : pas de souscription DOM-TOM.");
    else if(coef===null) warns.push("REVOLUO : département requis pour le zonage.");
    else if(age>80) warns.push("REVOLUO : non éligible à "+age+" ans (grille 18–80 ans).");
    else for(const key of ["REV","RF50","RF100"]){
      if(!on(key)) continue;
      const g0=D.RVL[key];
      const g={}; for(const a in g0) g[a]=g0[a].map(v=>v==null?v:Math.round(v*RVALIGN*100)/100);
      const L18=g["19"];                                 // la ligne « 19 » de la grille source est le tarif 18 ans
      const rowOf=a=>(a<=18)?L18:g[String(a)];
      const row=rowOf(age);
      for(let f=0;f<F[key].names.length;f++){
        const bA=row&&row[f]; if(!bA) continue;
        const pA=r2(bA*coef);
        let pC=null;
        if(hasCnj&&cnjAge!=null){
          const rw=(cnjAge<=80)?rowOf(cnjAge):null;
          pC=(rw&&rw[f])?r2(rw[f]*coef):undefined;
        }
        let pK=null,kidNote="";
        if(kids>0){const kn=Math.min(2,kids),bk=r2(L18[f]*coef);pK=r2(bk*kn);kidNote=kn+" × "+eur(bk)+(kids>2?" (3ᵉ+ gratuit)":"")+" — tarif 18 ans";}
        const tot=r2((pA+((pC&&pC!==undefined)?pC:0)+(pK||0))*fam);
        rows.push({key,fi:f,ins:"avenir",resp:true,gamme:F[key].label,formule:F[key].names[f],
          hospO:F[key].hospO[f],hospN:F[key].hospN[f],honoO:F[key].honoO[f],honoN:F[key].honoN[f],
          dent:F[key].dent[f],opt:F[key].opt[f],ch:F[key].ch[f],md:F[key].md[f],
          chips:[["resp","Responsable"]].concat(fam<1?[["info","Réduction famille −"+Math.round((1-fam)*100)+" %"]]:[]),
          pA,pC:hasCnj?pC:null,pK,kidNote,total:tot,incomplete:false,
          // sans le souscripteur parmi les assurés (enfants ± conjoint seuls) : même règle famille, un adulte de moins
          noSubTotal:r2(((pC||0)+(pK||0))*(((nAd-1)===2||(nPers-1)>=3)?0.90:((nAd-1)===1&&kids===1)?0.95:1))});
      }
    }
  }
  // MUTUELLE VERTE GCI — âge réel, ZT1-4 (régime général) ou grille Alsace-Moselle, 2 enfants payants
  if(on("MV")){
    const g=D.MV;
    const mz=isRL?"AL":(dept?(D.MVZ[dept]!==undefined?String(D.MVZ[dept]):null):null);
    const mvAge=a2=>String(Math.min(Math.max(a2,18),85));
    if(dept&&dept.length===3) warns.push("M. VERTE : grille DOM non fournie (gamme courtage).");
    else if(mz===null) warns.push("M. VERTE : zone inconnue pour ce département — non calculée.");
    else if(age<18) warns.push("M. VERTE : adhésion à partir de 18 ans.");
    else {
      const gr=g[mz];
      if(kids>2) warns.push("M. VERTE : 2 enfants payants appliqués — la gratuité du 3ᵉ enfant et suivants est à confirmer auprès de la mutuelle.");
      for(let f=0;f<5;f++){
        const pA=gr[mvAge(age)][f];
        let pC=null;
        if(hasCnj&&cnjAge!=null) pC=(cnjAge>=18)?gr[mvAge(cnjAge)][f]:undefined;
        let pK=null,kidNote="";
        if(kids>0){const kn=Math.min(2,kids);pK=Math.round(gr["E"][f]*kn*100)/100;kidNote=kn+" enfants payants × "+eur(gr["E"][f])+(kids>2?" — gratuité du 3ᵉ à confirmer":"");}
        const total=Math.round((pA+((pC&&pC!==undefined)?pC:0)+(pK||0))*100)/100;
        const rsp=f<4;
        rows.push({key:"MV",fi:f,ins:"mverte",resp:rsp,gamme:"M. VERTE",formule:F.MV.names[f],
          hospO:F.MV.hospO[f],hospN:F.MV.hospN[f],honoO:F.MV.honoO[f],honoN:F.MV.honoN[f],
          dent:F.MV.dent[f],opt:F.MV.opt[f],ch:F.MV.ch[f],md:F.MV.md[f],
          chips:[rsp?["resp","Responsable"]:["nr","Non responsable"],["info","Âge réel"],["info","Délais de stage"]],
          pA,pC:hasCnj?pC:null,pK,kidNote,total,incomplete:false});
      }
    }
  }
  // LPS HOSPI — hospitalisation seule, zone AVENIR ou colonne RL, 16-100 ans, pas de tarif enfant
  if(on("LPSH")){
    const g=D.LPSH;
    const c=isRL?3:(dept&&D.AVZ[dept]?D.AVZ[dept]-1:null);
    if(c===null){ warns.push("LPS HOSPI : code postal requis pour le zonage AVENIR."); }
    else if(age>=16&&age<=100){
      const a=String(age);
      let pC=null;
      if(hasCnj&&cnjAge!=null&&cnjAge>=16)pC=g[String(Math.min(Math.max(cnjAge,16),100))][c*2+1];
      push("LPSH",0,"",[["nr","Non responsable"],["info","Hospitalisation seule"],["info","IJ 20 €/jour"]],
        g[a][c*2],hasCnj?pC:null,null,kids>0?"mineurs : nous consulter":"",false);
    }
  }
  // TALIS — surcomplémentaire : elle vient en plus d'une complémentaire, pas à la place.
  // La mêler au comparatif fausserait la lecture, son tarif ne couvrant qu'un complément :
  // elle n'apparaît donc que si le conseiller la demande.
  if(sel.TALIS&&age>=16){
    const g=D.TALIS;
    const a=String(Math.min(Math.max(age,16),100));
    for(let f=0;f<2;f++){
      const pA=g[a][f*2];
      let pC=null;
      if(hasCnj&&cnjAge!=null&&cnjAge>=16)pC=g[String(Math.min(Math.max(cnjAge,16),100))][f*2+1];
      const kp=g["15"][f*2];
      const pK=kids>0?kp*kids:null;
      push("TALIS",f,"",[["info","Surcomplémentaire"],["nr","Non responsable"]],pA,hasCnj?pC:null,pK,
        kids>0?(kids+" × "+eur(kp)):"",false);
    }
  }
  if(isRL) warns.push("Régime local Alsace-Moselle : grilles MCCI non applicables (taux spécifiques, consulter MCCI) — restent CAP EVOLUTION RL, CAP NR RL et TALIS.");
  if(kids>0&&on("LPSH")) warns.push("LPS HOSPI : pas de tarif enfant dans la grille 2026 — total affiché hors mineurs pour cette gamme.");
  if(kids>0&&on("MCCINOVA")&&!isRL) warns.push("MCCINOVA : les mineurs sont tarifés au tarif 18 ans, sans gratuité à partir du 3ᵉ enfant.");
  // API SANTÉ (APICIL) — tarif demandé à l'assureur, pas de grille locale à maintenir
  // API Santé est une complémentaire comme les autres : même règle de sélection.
  // Son tarif vient d'un appel en ligne, temporisé ici et plafonné côté relais.
  // API SANTÉ (APICIL) — tarif demandé à l'assureur, pas de grille locale à maintenir.
  // Le moteur n'appelle jamais le réseau : l'appelant (page ou serveur) lui remet le
  // résultat de l'interrogation, le moteur en fait des lignes comme pour les autres gammes.
  if(on("APICIL")){
    if(!api.profil) warns.push("API SANTÉ : code postal ou département requis.");
    else if(api.etat==="ok"&&api.tarifs){
      const chips=[["resp","Responsable"]].concat(chMadelin);
      if(hasCnj||kids>0) chips.push(["info","Tarif foyer"]);
      let n=0;
      CODES_APICIL.forEach((code,i)=>{
        const t=api.tarifs[code]; if(t==null)return;   // l'API ne renvoie que les formules éligibles
        n++;
        rows.push({key:"APICIL",fi:i,ins:"apicil",resp:true,gamme:F.APICIL.label,formule:F.APICIL.names[i],
          hospO:F.APICIL.hospO[i],hospN:F.APICIL.hospN[i],honoO:F.APICIL.honoO[i],honoN:F.APICIL.honoN[i],
          dent:F.APICIL.dent[i],opt:F.APICIL.opt[i],aud:F.APICIL.aud[i],ch:F.APICIL.ch[i],md:F.APICIL.md[i],
          chips:chips.slice(),pA:t,pC:null,pK:null,kidNote:"",total:t,incomplete:false,foyer:(hasCnj||kids>0)});
      });
      if(!n) warns.push("API SANTÉ : aucune formule éligible pour ce profil.");
      else{
        if(kids>0) warns.push("API SANTÉ : les mineurs sont transmis à 10 ans, le comparateur ne demandant pas leur âge — tarif à confirmer.");
        if(api.approche) warns.push("API SANTÉ : date de naissance ramenée au 1ᵉʳ janvier faute de date exacte — saisir la date complète dans la fiche pour un tarif certain.");
        if(!api.cpExact) warns.push("API SANTÉ : code postal complété en "+api.profil.codePostalAssure+" à partir du département — saisir les 5 chiffres pour un tarif exact.");
      }
    }
    else if(api.etat==="attente") warns.push("API SANTÉ : tarifs en cours d'interrogation…");
    else if(api.etat==="erreur")  warns.push("API SANTÉ : "+api.message+".");
  }
  rows.sort((x,y)=>x.total-y.total);
  return {rows,warns};
}

exporter.parseAge=parseAge;
exporter.departement=deptOf;
exporter.zones=zones;
exporter.calculer=calculer;
exporter.CODES_APICIL=CODES_APICIL;
exporter.eur=eur;

})(typeof module!=="undefined"&&module.exports ? module.exports
   : ((typeof self!=="undefined"?self:this).Moteur={}));
