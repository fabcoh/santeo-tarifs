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

// 4. Le gain de la surcomplémentaire = ce qu'elle rembourse − sa cotisation = coût réel mutuelle seule − coût réel cumul.
{ const R=T.cumulDepenses(G,{key:"FLEXIA",fi:0},{key:"TALIS",fi:1},{cour:{n:1,p:600},imp:{n:1,p:1000},lun:{n:1,p:250}}); n++;
  const p1=42.60,p2=45.33, seule=p1*12+(R.dep-R.secu-R.mut), cumul=(p1+p2)*12+R.reste, g=R.sur-p2*12;
  if(Math.abs((seule-cumul)-g)>0.01) ko.push("gain TALIS incoherent : "+(seule-cumul)+" / "+g);
  if(Math.abs(R.sur-560)>0.005) ko.push("FLEXIA Start + Talis + : TALIS paie "+R.sur+" au lieu de 560"); }

// 5. La vignette se dessine (avec et sans tarifs, avec et sans dépenses) sur toutes les formules.
for(const k of Object.keys(G.gammes)){ if(k==="TALIS")continue;
  for(let fi=0;fi<G.gammes[k].names.length;fi++) for(const dep of [null,{cour:{n:1,p:600},imp:{n:1,p:1000},lun:{n:1,p:250}},{md:{auto:1},phn:{auto:1}}]) for(const t of [{},{[k+"|"+fi]:50,"TALIS|1":40}]){
    n++; try{ const h=T.cumul(G,{mut:{key:k,fi},sur:{key:"TALIS",fi:1},tarifs:t,depenses:dep,date:"20/10/2026"});
      if(!/class="cumul"/.test(h)) ko.push("vignette vide : "+k+" "+fi); }
    catch(e){ ko.push("vignette en erreur : "+k+" "+fi+" — "+e.message); } }}

// 6. Médecines douces et pharmacie au forfait d'office : remboursées en entier, à hauteur des deux forfaits réunis.
{ const R=T.cumulDepenses(G,{key:"SOLENCIA",fi:1},{key:"TALIS",fi:1},{md:{auto:1},phn:{auto:1}}); n++;
  const md=R.lignes.find(l=>l.id==="md"), ph=R.lignes.find(l=>l.id==="phn");
  if(!md||md.dep!==310||md.mut!==250||md.sur!==60||md.reste!==0) ko.push("forfait medecines douces SOLENCIA 5x50 + TALIS 3x20 : "+JSON.stringify(md));
  if(!ph||ph.dep!==95||ph.reste!==0) ko.push("forfait pharmacie SOLENCIA 45 + TALIS 50 : "+JSON.stringify(ph));
  const R2=T.cumulDepenses(G,{key:"MV",fi:1},{key:"TALIS",fi:0},{md:{auto:1},phn:{auto:1}}); n++;
  const m2=R2.lignes.find(l=>l.id==="md"), p2=R2.lignes.find(l=>l.id==="phn");
  if(!m2||m2.mut!==60) ko.push("Mutuelle Verte GCI 150 : 3 seances a 20 € = 60 € attendus : "+JSON.stringify(m2));
  if(!p2||p2.mut!==0) ko.push("Mutuelle Verte : l'antitabac ne compte pas en pharmacie : "+JSON.stringify(p2)); }

// 7. Le comparatif des mutuelles se dessine, et désigne bien la formule au coût réel le plus bas.
for(const dep of [null,{cour:{n:1,p:680},imp:{n:1,p:1000},md:{auto:1},phn:{auto:1}}]){ n++;
  try{ const cols=[{key:"FLEXIA",fi:1},{key:"CAPEVO",fi:2},{key:"MV",fi:2},{key:"REV",fi:4}], t={"FLEXIA|1":60,"CAPEVO|2":70,"MV|2":65,"REV|4":55};
    const h=T.comparatifSoins(G,{cols,tarifs:t,depenses:dep}); if(!/cu-cmp/.test(h)) ko.push("comparatif vide");
    if(dep){ const tot=cols.map(c=>t[c.key+"|"+c.fi]*12+T.cumulDepenses(G,c,null,{cour:dep.cour,imp:dep.imp,md:{n:1,p:250},phn:{n:1,p:45}}).reste);
      const nom=T.nomComplet(G,cols[tot.indexOf(Math.min(...tot))].key,cols[tot.indexOf(Math.min(...tot))].fi);
      if(h.indexOf('<em>'+nom+'</em>')<0) ko.push("comparatif : la moins chère devrait être "+nom); } }
  catch(e){ ko.push("comparatif en erreur — "+e.message); } }

// 8. Le plafond dentaire ne touche que les soins dentaires (constaté le 20/10/2026 : lunettes et médecines douces de la
// Mutuelle Verte « plafond atteint » après une couronne et un implant).
{ const R=T.cumulDepenses(G,{key:"MV",fi:2},null,{cour:{n:1,p:680},imp:{n:1,p:1000},lun:{n:1,p:300},md:{n:1,p:160},phn:{n:1,p:30}}); n++;
  for(const l of R.lignes) if(["lun","md","phn"].includes(l.id)&&l.atM) ko.push("plafond dentaire applique a "+l.id);
  const md=R.lignes.find(l=>l.id==="md"); if(!md||md.mut!==90) ko.push("MV GCI 200 medecines douces : 90 € attendus : "+JSON.stringify(md)); }

if(ko.length){ console.error(ko.length+" ecart(s) sur "+n+" cas :\n"+ko.slice(0,20).join("\n")); process.exit(1); }
console.log("Regles du cumul : "+n+" cas, aucun ecart.");
