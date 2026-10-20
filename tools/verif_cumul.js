#!/usr/bin/env node
// Règles du cumul mutuelle + surcomplémentaire (vignette 🧮 Cumul, Tableau.cumulDepenses) — contrôle sans navigateur.
// L'Action le lance avant de publier : une règle cassée arrête la publication. Règles et origine :
// .claude/skills/calculette-cumul/SKILL.md. En local : node tools/verif_cumul.js
"use strict";
const path=require("path");
const racine=path.join(__dirname,"..");
const T=require(path.join(racine,"src/tableau.js")), G=require(path.join(racine,"src/garanties.json"));
const ko=[]; let n=0;
const ids=T.CU_DEP.map(L=>L[0]);
const sm=R=>R.secu+R.mut+R.sur;

// 1. Jamais plus remboursé que la dépense, soin par soin et au total ; aucun montant négatif.
for(const k of Object.keys(G.gammes)){ if(k==="TALIS")continue;
  for(let fi=0;fi<G.gammes[k].names.length;fi++) for(const si of [0,1])
    for(const p of [1,30,60,90,120,200,279.5,400,600,1000,2500]) for(const nb of [1,3]){
      const dep={}; for(const id of ids) dep[id]={n:nb,p};
      const R=T.cumulDepenses(G,{key:k,fi},{key:"TALIS",fi:si},dep); n++;
      for(const l of R.lignes){
        if(l.secu+l.mut+l.sur>l.dep+0.005) ko.push("rembourse plus que la depense : "+[k,fi,si,p,nb,l.id].join(" "));
        if(l.reste<-0.005||l.mut<-0.005||l.sur<-0.005||l.secu<-0.005) ko.push("montant negatif : "+[k,fi,si,p,nb,l.id].join(" "));
      }
      if(sm(R)>R.dep+0.01) ko.push("total superieur a la depense : "+[k,fi,si,p,nb].join(" "));
    }}

// 2. Le plafond dentaire de TALIS (600 € / Talis + 900 €) n'est jamais dépassé.
for(const k of Object.keys(G.gammes)){ if(k==="TALIS")continue;
  for(let fi=0;fi<G.gammes[k].names.length;fi++) for(const si of [0,1]){
    const dep={cour:{n:6,p:900},bri:{n:2,p:1500},inl:{n:3,p:400},imp:{n:3,p:2000},orR:{n:2,p:900},orN:{n:2,p:900}};
    const R=T.cumulDepenses(G,{key:k,fi},{key:"TALIS",fi:si},dep); n++;
    const dent=R.lignes.reduce((u,l)=>u+l.sur,0);
    if(dent>(si?900:600)+0.005) ko.push("plafond TALIS depasse : "+[k,fi,si,dent].join(" "));
  }}

// 3. Cas relus à la main (Fabrice, 20/10/2026).
const cas=[
  // Cap Évolution Sérénité + Talis + : 3 couronnes à 800 €, 2 implants à 1 500 € → mutuelle 1 100 € (plafond), TALIS 900 €.
  [{key:"CAPEVO",fi:3},{key:"TALIS",fi:1},{cour:{n:3,p:800},imp:{n:2,p:1500}},{secu:216,mut:1100,sur:900}],
  // Cap Évolution Sérénité + Talis + : 1 couronne à 600 €, 1 implant à 1 000 € → couronne 240 + 100, implant 700 + 300.
  [{key:"CAPEVO",fi:3},{key:"TALIS",fi:1},{cour:{n:1,p:600},imp:{n:1,p:1000}},{secu:72,mut:868,sur:400}],
];
for(const [M,S,dep,att] of cas){ const R=T.cumulDepenses(G,M,S,dep); n++;
  for(const k in att) if(Math.abs(R[k]-att[k])>0.005) ko.push("cas "+M.key+" "+M.fi+" : "+k+" = "+R[k]+" au lieu de "+att[k]); }

if(ko.length){ console.error(ko.length+" ecart(s) sur "+n+" cas :\n"+ko.slice(0,20).join("\n")); process.exit(1); }
console.log("Regles du cumul : "+n+" cas, aucun ecart.");
