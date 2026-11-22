/* Mail « vitrine » du CRM Santéo : les offres à montrer à une fiche (3, 6 ou 9).
 *
 * Demande de CRM Santeo, validée par Fabrice le 21/11/2026 (« ok lance la construction du mail ») :
 *  - nombre d'offres selon l'âge : « les jeunes de 18 à 29 = 3 offres, de 30 à 50 = 6 offres, de 51 à plus = 9 offres » ;
 *  - niveau : « les deux, l'âge et les étoiles du site » — un niveau d'office selon l'âge, relevé poste par
 *    poste par les étoiles que le client a choisies sur www.santeo.net ;
 *  - « un mixte de nos meilleures solutions » : contrats responsables seulement, ni TALIS (surcomplémentaire)
 *    ni LPS Hospi (hospitalisation seule) ; une compagnie par offre avant d'en répéter une ; pour chaque
 *    compagnie, la formule la moins chère qui atteint le niveau ; Cap Évolution (Avenir Mutuelle) en tête, avec
 *    le « 1 mois offert » ; 9 offres = les 6 + un niveau au-dessus pour les 3 compagnies les moins chères ;
 *  - une offre sans prix réel (relais APRIL ou APICIL absent ou en erreur) n'est jamais choisie.
 *
 * Étoiles 0 à 5 par poste : la grille du site (fabcoh/santeo-site, maquette/template.html, « grille validée par
 * Fabrice, 08/11/2026 ») — hospitalisation et honoraires OPTAM, prothèses dentaires en % : 1 = jusqu'à 125 %,
 * 2 = jusqu'à 175 %, 3 = jusqu'à 275 %, 4 = jusqu'à 350 %, 5 au-delà ; optique (verres simples et monture) en €,
 * mêmes seuils, un forfait en % (« 100 % BR », 100 % Santé) vaut 1 ; « — », vide ou « n.c. » = 0.
 * Recopiée ici telle quelle : si elle change, la changer aux deux endroits (ou faire lire ce module par le site).
 *
 * Fonction pure, sans DOM ni réseau : navigateur (window.Vitrine) et Node (require("./vitrine.js")).
 *
 *   const {rows} = Moteur.calculer({...});           // APRIL / APICIL : réponses des relais remises au moteur
 *   const v = Vitrine.choisir(rows, {age: 40, etoiles: {hosp: 3, hono: 2, dent: 4, opt: 2}, G, reg: "SAL"});
 *   v.offres → [{key, fi, cle, assureur, gamme, formule, nom, prix, etoiles:{hosp,hono,dent,opt},
 *                valeurs:{hospO,honoO,dent,opt}, palier, enDessous, reco, offert, documents:[{libelle,url}]}]
 *   palier : « base » (atteint la cible), « plus » (un niveau au-dessus, mail à 9), « approche » (ne l'atteint pas :
 *   étoiles du client trop hautes pour assez de formules ; enDessous = les postes en dessous). v.notes dit pourquoi.
 */
(function(exporter){
"use strict";

// --- Étoiles (grille du site, 08/11/2026) ------------------------------------------------------------
const SEUILS_ETOILES=[125,175,275,350];      // ≤ 125 → 1 … > 350 → 5
const POSTES=[                                // poste du site → champ des garanties
  {k:"hosp", champ:"hospO", nom:"Hospitalisation"},
  {k:"hono", champ:"honoO", nom:"Honoraires"},
  {k:"dent", champ:"dent",  nom:"Dentaire"},
  {k:"opt",  champ:"opt",   nom:"Optique"}
];
const vide=s=>s==null||s===""||s==="—"||s==="n.c.";
function premierNombre(s){const m=String(s).replace(/\s/g,"").replace(",",".").match(/\d+(?:\.\d+)?/);return m?+m[0]:null}
function palier(v){let n=1;for(const s of SEUILS_ETOILES) if(v>s) n++;return n}
function etoile(champ,s){
  if(vide(s)) return 0;
  if(champ==="opt"&&/%/.test(String(s))) return 1;
  const v=premierNombre(s); return v==null?0:palier(v);
}
function etoiles(r){const o={};for(const p of POSTES) o[p.k]=etoile(p.champ,r[p.champ]);return o}

// --- Règles du mail ----------------------------------------------------------------------------------
// Nombre d'offres selon l'âge de l'assuré principal (âge atteint dans l'année).
function nombreOffres(age){return age<=29?3:age<=50?6:9}
// Niveau d'office (mêmes étoiles sur les 4 postes), avant les étoiles du client.
// Proposition du comparateur, à revoir avec Fabrice : 18–29 ans 1, 30 ans et plus 2 ; le palier « plus » du mail
// à 9 offres vise un niveau au-dessus.
function niveauAge(age){return age<=29?1:2}
const EXCLUS={TALIS:1,LPSH:1};               // surcomplémentaire, hospitalisation seule
const TETE="avenir";                          // Cap Évolution en tête, avec le mois offert
const ASSUREURS={avenir:"Avenir Mutuelle", mcci:"MCCI", mverte:"La Mutuelle Verte", rema:"REMA (Révoluo)",
                 apicil:"APICIL", april:"APRIL"};

// Une ligne du moteur peut-elle entrer dans le mail ?
function admise(r,o){
  if(!r||r.incomplete) return false;
  if(!(typeof r.total==="number"&&isFinite(r.total)&&r.total>0)) return false;   // jamais sans prix réel
  if(EXCLUS[r.key]) return false;
  if(r.resp!==true) return false;                                                 // responsables seulement
  if(r.key==="SOLENCIA"&&!o.retraite) return false;                               // réservée aux retraités
  if(POSTES.some(p=>r[p.champ]==="n.c.")) return false;                           // garanties non vérifiées
  return true;
}
function atteint(st,cible){return POSTES.every(p=>st[p.k]>=cible[p.k])}

// --- Minimums en vraies valeurs (curseurs de la page vitrine, demande de Fabrice du 22/11/2026 : « comme un filtre ») ---
// o.minimums = {hospO, honoO, dent : en % (100 = « Essentiel ») ; opt : 1 = « Essentiel » (100 % Santé ou tout
// forfait), sinon en euros ; 0 ou absent = pas de besoin}. Valeur lue = 1er nombre du texte de la garantie, dans
// l'unité du poste : un texte dans l'autre unité ne passe pas (jamais comparé à tort), sauf l'optique en % au cran
// « Essentiel ». « — », vide ou « n.c. » ne passent que sans besoin.
const CHAMPS_MIN=["hospO","honoO","dent","opt"];
function minimumsDe(m){
  if(!m||typeof m!=="object") return null;
  const o={};let un=false;for(const c of CHAMPS_MIN){const v=+m[c];o[c]=isFinite(v)&&v>0?v:0;if(o[c])un=true}
  return un?o:null;                                          // tout à 0 = pas d'exigence en plus
}
function tientMinimum(champ,s,min){
  if(!min) return true;
  if(vide(s)) return false;
  const t=String(s), v=premierNombre(t); if(v==null) return false;
  if(champ==="opt"){
    if(min<=1) return v>0;                                    // Essentiel : couvert, en % ou en €
    return /€/.test(t)&&!/^\s*\d+(?:[.,]\d+)?\s*%/.test(t)&&v>=min; // un forfait en euros
  }
  return /%/.test(t)&&!/^\s*\d+(?:[.,]\d+)?\s*€/.test(t)&&v>=min;
}
function tientMinimums(r,m){return CHAMPS_MIN.every(c=>tientMinimum(c,r[c],m[c]))}
function nomLisible(r){return (r.gamme+" "+r.formule).replace(/(^|\s)(\S+) \2(?=\s|$)/,"$1$2")}
function cle(r){return r.key==="APRIL"&&r.april?"APRIL:"+r.april+"|"+(r.fi%100):r.key+"|"+r.fi}

// Documents : même règle que Tableau.documents (entrée « _TNS » pour un régime TNS), plus la section april.
function documentsDe(G,r,reg){
  if(!G) return [];
  let d,idx=r.fi;
  if(r.key==="APRIL"){d=((G.april||{}).documents||{})[r.april];idx=(r.fi%100)-1}
  else{const D=G.documents||{};d=(/^TNS/.test(reg||"")&&D[r.key+"_TNS"]!==undefined)?D[r.key+"_TNS"]:D[r.key]}
  if(!d) return [];
  const out=[];
  for(const k of Object.keys(d)){const v=d[k],url=Array.isArray(v)?v[idx]:v;if(url) out.push({libelle:k,url:url})}
  return out;
}

function offre(r,palierNom,o){
  const st=etoiles(r);
  return {key:r.key, fi:r.fi, cle:cle(r), assureur:ASSUREURS[r.ins]||r.ins, ins:r.ins, gamme:r.gamme, formule:r.formule,
    nom:nomLisible(r), prix:Math.round(r.total*100)/100, etoiles:st,
    valeurs:{hospO:r.hospO, honoO:r.honoO, dent:r.dent, opt:r.opt},
    palier:palierNom, enDessous:[], reco:false, offert:r.ins==="avenir", documents:documentsDe(o.G,r,o.reg)};
}

/* rows : la sortie de Moteur.calculer (tableau rows, ou l'objet {rows}).
 * o.age (obligatoire), o.nb (sinon d'après l'âge), o.etoiles {hosp,hono,dent,opt} 0–5 ou null,
 * o.minimums {hospO, honoO, dent (en %), opt (1 = Essentiel, sinon en €)} : filtre en vraies valeurs (voir plus haut).
 *   Les minimums S'AJOUTENT au niveau d'office selon l'âge et aux étoiles (CRM Santeo, 22/11/2026, échelle validée par
 *   Fabrice : « garde le niveau d'office… les minimums ne font qu'ajouter des exigences ») : une offre doit atteindre les
 *   deux. Au moins un minimum > 0 : pas de palier « approche » — s'il y a moins d'offres que nb, on rend ce qui passe.
 * o.G (garanties.json, pour les documents), o.reg (SAL | TNS | RL | TNSRL), o.retraite (SOLENCIA admise).
 * Rend {offres, nb, cible, ciblePlus, minimums, notes} ; offres.length < nb si les lignes ne suffisent pas (notes le dit). */
function choisir(rows,o){
  o=o||{}; rows=Array.isArray(rows)?rows:((rows&&rows.rows)||[]);
  const mins=minimumsDe(o.minimums);
  const age=+o.age, nb=o.nb||nombreOffres(age), base=niveauAge(age), et=o.etoiles||{};
  const cible={}, ciblePlus={};
  for(const p of POSTES){
    const c=Math.max(base,Math.min(5,Math.max(0,Math.round(+et[p.k]||0))));
    cible[p.k]=c; ciblePlus[p.k]=Math.min(5,c+1);
  }
  const notes=[];
  const cand=rows.filter(r=>admise(r,o)).map(r=>({r:r,st:etoiles(r)})).sort((a,b)=>a.r.total-b.r.total);
  const pris=new Set(), offres=[];
  const prendre=(c,pal)=>{pris.add(c.r.key+"|"+c.r.fi);offres.push(offre(c.r,pal,o))};
  const libre=c=>!pris.has(c.r.key+"|"+c.r.fi);

  const somme=st=>POSTES.reduce((s,p)=>s+st[p.k],0);
  // Manque d'une offre face à la cible : étoiles qui manquent, tous postes confondus (0 = atteinte).
  const manque=(st,cb)=>POSTES.reduce((s,p)=>s+Math.max(0,cb[p.k]-st[p.k]),0);
  // Passe le niveau : étoiles (âge + client), et en plus les minimums du client s'il en a donné.
  const passe=c=>atteint(c.st,cible)&&(!mins||tientMinimums(c.r,mins));
  const passePlus=c=>atteint(c.st,ciblePlus)&&(!mins||tientMinimums(c.r,mins));

  // 1. Une compagnie par offre, la moins chère qui atteint la cible ; Avenir Mutuelle d'abord.
  const parCie=new Map();
  for(const c of cand) if(passe(c)&&!parCie.has(c.r.ins)) parCie.set(c.r.ins,c);
  const cies=[...parCie.values()].sort((a,b)=>(a.r.ins===TETE?-1:b.r.ins===TETE?1:a.r.total-b.r.total));
  if(!parCie.size) notes.push(mins?"Aucune formule tarifée ne remplit tous les minimums demandés.":"Aucune formule tarifée n'atteint le niveau demandé.");
  else if(!parCie.has(TETE)) notes.push("Aucune formule Avenir Mutuelle n'atteint le niveau demandé : pas d'offre Cap Évolution en tête.");
  const passe1=Math.min(nb,6);
  for(const c of cies){if(offres.length>=passe1) break; prendre(c,"base")}
  const tete=offres.length&&offres[0].ins===TETE?offres[0]:null;

  // 2. Au-delà de 6 (mail à 9) : un niveau au-dessus, pour les compagnies retenues les moins chères —
  //    la moins chère de la compagnie qui atteint la cible relevée d'une étoile et fait mieux que son offre de base.
  if(offres.length<nb){
    const retenues=cies.filter(c=>pris.has(c.r.key+"|"+c.r.fi)).sort((a,b)=>a.r.total-b.r.total);
    for(const b of retenues){
      if(offres.length>=nb) break;
      const c=cand.find(c=>c.r.ins===b.r.ins&&libre(c)&&passePlus(c)&&somme(c.st)>somme(b.st));
      if(c) prendre(c,"plus");
    }
  }
  // 3. Encore de la place : à tour de rôle par compagnie (la moins chère d'abord), la formule suivante qui atteint la cible.
  for(let tour=true;tour&&offres.length<nb;){
    tour=false;
    for(const ins of [...new Set(cand.map(c=>c.r.ins))]){
      if(offres.length>=nb) break;
      const c=cand.find(c=>c.r.ins===ins&&libre(c)&&passe(c));
      if(c){prendre(c,"base");tour=true}
    }
  }
  // 4. Toujours pas assez (étoiles du client très hautes) : les plus proches de la cible, marquées « approche »,
  //    avec les postes en dessous ; une compagnie par offre d'abord. Jamais une offre sans prix.
  if(offres.length<nb&&!mins){
    const proches=cand.filter(libre).sort((a,b)=>manque(a.st,cible)-manque(b.st,cible)||a.r.total-b.r.total);
    const vus=new Set(offres.map(x=>x.ins));
    const ordre=proches.filter(c=>!vus.has(c.r.ins)&&(vus.add(c.r.ins),true)).concat(proches);
    const avant=offres.length;
    for(const c of ordre){
      if(offres.length>=nb) break; if(!libre(c)) continue;
      prendre(c,"approche");
      const o=offres[offres.length-1];
      o.enDessous=POSTES.filter(p=>c.st[p.k]<cible[p.k]).map(p=>p.k);
    }
    if(offres.length>avant) notes.push((offres.length-avant)+" offre(s) n'atteignent pas toutes les étoiles demandées (palier « approche », postes dans enDessous).");
  }
  if(offres.length<nb&&offres.length) notes.push(offres.length+" offre(s) sur "+nb+" : pas assez de formules tarifées"+(mins?" qui remplissent les minimums demandés.":"."));

  // Ordre d'affichage : l'offre Avenir Mutuelle de la 1re passe en tête (conseillée), puis les offres qui atteignent
  // la cible du moins cher au plus cher, puis celles qui l'approchent.
  const rang=x=>x===tete?0:x.palier==="approche"?2:1;
  offres.sort((a,b)=>rang(a)-rang(b)||a.prix-b.prix);
  if(offres.length) offres[0].reco=true;
  return {offres:offres, nb:nb, cible:cible, ciblePlus:ciblePlus, minimums:mins, notes:notes};
}

/* Garanties APRIL pour Moteur.calculer (F.APRIL), tirées de garanties.json → april : {champ: {fi: valeur}}.
 * Un niveau absent de la section reste « n.c. » dans le moteur, donc hors du mail. */
function garantiesApril(G){
  const A=(G&&G.april&&G.april.gammes)||{}, F={};
  for(const code of Object.keys(A)){
    const g=A[code];
    (g.fi||[]).forEach((fi,i)=>{for(const c of ["hospO","hospN","honoO","honoN","dent","opt","aud","ch","md"])
      if(g[c]&&g[c][i]!==undefined)(F[c]=F[c]||{})[fi]=g[c][i];});
  }
  return F;
}

/* ---- Prix APICIL (API Santé, Veralti) et APRIL pour le serveur du CRM Santéo -----------------------------------------
 * Accord de Fabrice du 22/11/2026, 8 h 12 (« Oui », relayé par CRM Santeo) : les prix APRIL et APICIL du mail vitrine sont
 * demandés aux relais capisante.fr (apicil.php, april.php : POST JSON, en-tête X-Cle-Serveur, tarification seulement, rien
 * d'enregistré chez l'assureur), gardés 24 h au plus pour un même profil ; les curseurs ne redemandent rien.
 * Ces fonctions ne font que fabriquer le corps de l'appel et lire la réponse — mêmes règles que la page (comparateur.html :
 * apicilProfil, apicilCharge, aprilProfil, aprilCP, aprilNiveaux, aprilPourMoteur). L'appel lui-même est fait par l'appelant.
 *
 * profil = {naissance:'AAAA-MM-JJ' | 'AAAA', cp:'75011' | '75', reg:'SAL'|'TNS'|'RL'|'TNSRL',
 *           conjoint:'AAAA-MM-JJ' | 'AAAA' | null, enfants:n, aujourdHui?:Date}
 * Une année seule devient le 1er janvier (âge atteint dans l'année, comme partout dans le comparateur) ; les enfants, sans
 * date, partent à 10 ans (8 au plus) ; date d'effet = le 1er du mois qui suit aujourdHui. */
const APICIL_REG={SAL:["GENERAL","SALARIE"],TNS:["SSI","ACTIF"],RL:["ALSACEMOSELLE","SALARIE"],TNSRL:["ALSACEMOSELLE","ACTIF"]};
const APRIL_REG={SAL:"SS",TNS:"TNS",RL:"AlsaceMoselle",TNSRL:"AlsaceMoselle"};
const deux=n=>String(n).padStart(2,"0");
function jour(d){return d.getFullYear()+"-"+deux(d.getMonth()+1)+"-"+deux(d.getDate())}
function effetDe(auj){const d=new Date(auj||Date.now());d.setDate(1);d.setMonth(d.getMonth()+1);return jour(d)}
function naissanceISO(v){
  const s=String(v==null?"":v).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) return m[3]+"-"+m[2]+"-"+m[1];
  if(/^\d{4}$/.test(s)) return s+"-01-01";
  return null;
}
const cp5=s=>/^\d{5}$/.test(String(s||"").trim())?String(s).trim():null;
function deptDe(cp){
  const s=String(cp||"").trim().toUpperCase();
  if(/^\d{5}$/.test(s)) return s.startsWith("97")?s.slice(0,3):(s.startsWith("20")?(+s<=20190?"2A":"2B"):s.slice(0,2));
  if(/^(\d{2}|2A|2B|97\d)$/.test(s)) return s;
  return null;
}
function enfantsDe(p,auj){const y=new Date(auj||Date.now()).getFullYear(),n=Math.max(0,Math.min(8,+p.enfants||0)),o=[];
  for(let i=0;i<n;i++) o.push((y-10)+"-01-01"); return o;}

/* Corps de POST https://capisante.fr/apicil.php, ou null (pas de date de naissance, pas de code postal utilisable). */
function corpsApicil(p){
  p=p||{}; const r=APICIL_REG[p.reg]||APICIL_REG.SAL, dn=naissanceISO(p.naissance);
  const d=deptDe(p.cp), cp=cp5(p.cp)||(/^\d{2}$/.test(d||"")?d+"000":null);
  if(!dn||!cp) return null;
  const b=[{role:"ASSUR",dateNaissance:dn,regimeSocial:r[0]}];
  const dc=naissanceISO(p.conjoint); if(dc) b.push({role:"CONJT",dateNaissance:dc,regimeSocial:r[0]});
  for(const e of enfantsDe(p,p.aujourdHui)) b.push({role:"ENFNT",dateNaissance:e,regimeSocial:r[0]});
  return {codePostalAssure:cp,dateEffetContrat:effetDe(p.aujourdHui),situationProfessionnelle:r[1],beneficiaires:b};
}
/* Réponse d'apicil.php → paramètre apicil de Moteur.calculer. statut = code HTTP (0 = pas de réponse). */
function apicilPourMoteur(corps,statut,rep){
  if(!corps) return {etat:"erreur",message:"code postal ou date de naissance manquant"};
  if(!(statut>=200&&statut<300)) return {profil:corps,etat:"erreur",message:(rep&&rep.erreur)||("service indisponible (HTTP "+(statut||0)+")")};
  if(!rep||!Array.isArray(rep.Formules)) return {profil:corps,etat:"erreur",message:"réponse inattendue du service"};
  const t={}; rep.Formules.forEach(f=>{const v=parseFloat(f.TarifFormule); if(!isNaN(v)&&v>0) t[f.LibelleFormule]=v;});
  return {profil:corps,etat:"ok",tarifs:t,cpExact:!/000$/.test(corps.codePostalAssure)};
}

/* APRIL refuse un code postal qui n'existe pas (« 75000 ») : faute des 5 chiffres, celui du chef-lieu. */
function aprilCP(cp){
  const c=cp5(cp); if(c) return c;
  const d=deptDe(cp); if(!d) return null;
  const s={"13":"13001","69":"69001","75":"75001","2A":"20000","2B":"20200"}[d]; if(s) return s;
  if(/^97\d$/.test(d)) return d+"00";
  return /^\d{2}$/.test(d)?d+"000":null;
}
/* Produits demandés : ceux de garanties.json → april.gammes (garanties publiées), responsables ; produits TNS seulement
 * en régime TNS / TNSRL. */
function produitsApril(G,reg){
  const A=(G&&G.april&&G.april.gammes)||{}, tns=/^TNS/.test(reg||"");
  return Object.keys(A).filter(c=>A[c].resp===true&&(!A[c].tns||tns));
}
/* Corps de POST https://capisante.fr/april.php, ou null. */
function corpsApril(p,G){
  p=p||{}; const dn=naissanceISO(p.naissance), cp=aprilCP(p.cp), prod=produitsApril(G,p.reg);
  if(!dn||!cp||!prod.length) return null;
  const a=[{role:"AssurePrincipal",naissance:dn}];
  const dc=naissanceISO(p.conjoint); if(dc) a.push({role:"Conjoint",naissance:dc});
  for(const e of enfantsDe(p,p.aujourdHui)) a.push({role:"Enfant",naissance:e});
  return {cp:cp,effet:effetDe(p.aujourdHui),regime:APRIL_REG[p.reg]||"SS",assures:a,produits:prod,remise:false};
}
/* Un produit modulable (Santé Mix, Flexi) rend « 03|02 » : seule la diagonale (même niveau partout) est gardée. */
function aprilNiveaux(n){
  const k=Object.keys(n||{}).sort(), modul=k.some(x=>x.includes("|"));
  const garde=modul?k.filter(x=>x.includes("|")&&new Set(x.split("|")).size===1):k;
  return garde.map(x=>({niv:parseInt(x,10),prix:+n[x]})).filter(x=>x.niv>0&&x.prix>0);
}
/* Réponse d'april.php → paramètre april de Moteur.calculer (appeler Moteur.calculer avec sel.APRIL = true et
 * F = {...G.gammes, APRIL: Vitrine.garantiesApril(G)}). Un produit refusé par APRIL (âge…) est simplement absent. */
function aprilPourMoteur(statut,rep,G){
  if(!(statut>=200&&statut<300)||!rep||!Array.isArray(rep.produits)) return {etat:"erreur"};
  const A=(G&&G.april&&G.april.gammes)||{};
  const produits=rep.produits.filter(p=>p&&p.etat==="ok"&&A[p.produit]).map(p=>({code:p.produit,idx:A[p.produit].rang,
    nom:String(A[p.produit].label||p.produit).replace(/^APRIL\s+/,""),resp:A[p.produit].resp===true,niveaux:aprilNiveaux(p.niveaux)}));
  return {etat:"ok",famille:!!rep.famille&&!rep.liensFamille,produits:produits};
}

/* Paramètre sel de Moteur.calculer pour le mail : toutes les gammes ET APRIL. Attention : avec une seule coche
 * (sel = {APRIL:true}), le moteur ne calcule QUE les gammes cochées — APRIL seule. */
function selVitrine(G){const s={};Object.keys((G&&G.gammes)||{}).forEach(k=>s[k]=true);s.APRIL=true;return s}

/* Cache des réponses : clé = le corps exact envoyé (clés triées, donc stable) ; à garder jusqu'à expireLe, jamais une panne. */
function trie(v){if(Array.isArray(v)) return v.map(trie); if(v&&typeof v==="object"){const o={};Object.keys(v).sort().forEach(k=>o[k]=trie(v[k]));return o} return v}
function cleCache(corps){return corps?JSON.stringify(trie(corps)):""}
/* 24 h au plus, et jamais au-delà de la date d'effet du corps (le 1er du mois : la date d'effet change, et avec elle le tarif)
 * ni du 1er janvier (nouveaux tarifs). */
function expireLe(corps,maintenant){
  const t=new Date(maintenant||Date.now()), lim=[t.getTime()+24*3600e3];
  const e=corps&&(corps.dateEffetContrat||corps.effet);
  if(/^\d{4}-\d{2}-\d{2}$/.test(e||"")){const [y,m,d]=e.split("-").map(Number);lim.push(new Date(y,m-1,d).getTime())}
  lim.push(new Date(t.getFullYear()+1,0,1).getTime());
  return new Date(Math.min.apply(null,lim));
}
/* Une réponse se garde-t-elle ? Jamais une panne (pas de réponse, 5xx, délai) ; un 2xx oui ; un 4xx non plus (corps refusé). */
function gardable(statut){return statut>=200&&statut<300}

exporter.choisir=choisir;
exporter.etoiles=etoiles;
exporter.etoile=etoile;
exporter.tientMinimum=tientMinimum;
exporter.tientMinimums=tientMinimums;
exporter.nombreOffres=nombreOffres;
exporter.niveauAge=niveauAge;
exporter.garantiesApril=garantiesApril;
exporter.SEUILS_ETOILES=SEUILS_ETOILES;
exporter.POSTES=POSTES;
exporter.corpsApicil=corpsApicil;
exporter.apicilPourMoteur=apicilPourMoteur;
exporter.corpsApril=corpsApril;
exporter.aprilPourMoteur=aprilPourMoteur;
exporter.produitsApril=produitsApril;
exporter.selVitrine=selVitrine;
exporter.cleCache=cleCache;
exporter.expireLe=expireLe;
exporter.gardable=gardable;

})(typeof module!=="undefined"&&module.exports ? module.exports
   : ((typeof self!=="undefined"?self:this).Vitrine={}));
