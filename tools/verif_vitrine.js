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
  const v=Vitrine.choisir(rows,{age:c.age, minimums:c.mins, etoiles:{hosp:5,hono:5,dent:5,opt:5}, G, reg:"SAL"});
  const nom=c.age+" ans, minimums "+JSON.stringify(c.mins)+(c.relais?"":", relais absents");
  console.log("● "+nom+" → "+v.offres.length+"/"+v.nb+" offres");
  const admis=rows.filter(r=>r.resp===true&&r.total>0&&!["TALIS","LPSH","SOLENCIA"].includes(r.key)&&!["hospO","honoO","dent","opt"].some(k=>r[k]==="n.c."));
  const passent=admis.filter(r=>["hospO","honoO","dent","opt"].every(k=>tientRef(k,r[k],c.mins[k])));
  if(v.offres.length!==Math.min(v.nb,passent.length)) faute(nom,v.offres.length+" offres pour "+passent.length+" formules qui passent");
  if(c.vide&&(v.offres.length||!v.notes.length)) faute(nom,"aucune ne devait passer, avec une note");
  if(!v.minimums) faute(nom,"minimums non rendus");
  v.offres.forEach((o,i)=>{
    for(const k of ["hospO","honoO","dent","opt"]) if(!tientRef(k,o.valeurs[k],c.mins[k])) faute(nom,o.nom+" "+k+" « "+o.valeurs[k]+" » < "+c.mins[k]);
    if(o.palier==="approche") faute(nom,"palier approche en mode minimums");
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
}
console.log(fautes?"\n"+fautes+" écart(s).":"\nAucun écart : "+(CAS.length+CASMIN.length+1)+" cas.");
process.exit(fautes?1:0);
