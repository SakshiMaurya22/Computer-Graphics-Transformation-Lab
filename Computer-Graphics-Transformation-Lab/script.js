'use strict';
const $=id=>document.getElementById(id),DEG=Math.PI/180;
/* ---------- 3x3 homogeneous matrix library ---------- */
const I3=()=>[[1,0,0],[0,1,0],[0,0,1]];
const mul=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
const Tm=(x,y)=>[[1,0,x],[0,1,y],[0,0,1]];
const Rm=d=>{const a=d*DEG,c=Math.cos(a),s=Math.sin(a);return[[c,-s,0],[s,c,0],[0,0,1]]};
const Sm=(x,y)=>[[x,0,0],[0,y,0],[0,0,1]];
const Hm=(x,y)=>[[1,x,0],[y,1,0],[0,0,1]];
const ap=(M,p)=>[M[0][0]*p[0]+M[0][1]*p[1]+M[0][2],M[1][0]*p[0]+M[1][1]*p[1]+M[1][2]];
const pivot=(M,p)=>mul(Tm(p[0],p[1]),mul(M,Tm(-p[0],-p[1])));   // T(p)·M·T(-p)
/* reflection at parameter t (t=1 is the exact reflection matrix; t<1 is used for animation) */
function reflM(k,t=1){const f=1-2*t;
 if(k==='x')return Sm(1,f);if(k==='y')return Sm(f,1);if(k==='o')return Sm(f,f);
 return mul(Rm(45),mul(Sm(1,f),Rm(-45)))}                        // line y=x : R(45)·S(1,-1)·R(-45)
//END-MATH
const f3=n=>{n=Math.abs(n)<5e-10?0:n;return String(+n.toFixed(3))};
const mH=M=>'<table class="m">'+M.map(r=>'<tr>'+r.map(x=>'<td>'+f3(x)+'</td>').join('')+'</tr>').join('')+'</table>';
/* ---------- objects (Canvas primitives only) ---------- */
const ell=(cx,cy,rx,ry,rot=0,n=24)=>Array.from({length:n},(_,i)=>{const a=i/n*2*Math.PI,x=rx*Math.cos(a),y=ry*Math.sin(a),c=Math.cos(rot),s=Math.sin(rot);return[cx+x*c-y*s,cy+x*s+y*c]});
const rc=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],Pg=p=>({p,c:1});
const OBJ={point:()=>[{p:[[2,1]]}],line:()=>[{p:[[-1,-1],[3,2]]}],triangle:()=>[Pg([[0,0],[4,0],[2,3.5]])],rectangle:()=>[Pg(rc(0,0,4,2.5))],
polygon:()=>[Pg([[0,0],[3,-1],[4.5,1.5],[2.5,3.5],[-.5,2.5]])],circle:()=>[Pg(ell(2,1.5,2,2,0,48))],
star:()=>[Pg(Array.from({length:10},(_,i)=>{const r=i%2?1:2.6,a=Math.PI/2+i*Math.PI/5;return[2+r*Math.cos(a),1.5+r*Math.sin(a)]}))],
house:()=>[Pg(rc(0,0,4,2.6)),Pg([[-.4,2.6],[2,4.6],[4.4,2.6]]),Pg(rc(1.6,0,.9,1.5)),Pg(rc(.4,1.3,.8,.8)),Pg(rc(2.9,1.3,.8,.8))],
flower:()=>[...[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return Pg(ell(2+1.3*Math.cos(a),1.5+1.3*Math.sin(a),1,.5,a))}),Pg(ell(2,1.5,.6,.6))],
robot:()=>[Pg(rc(0,0,3,2.4)),Pg(rc(.5,2.6,2,1.4)),Pg(rc(.85,3.2,.4,.4)),Pg(rc(1.75,3.2,.4,.4)),{p:[[1.5,4],[1.5,4.8]]},Pg(rc(-.8,.4,.6,1.8)),Pg(rc(3.2,.4,.6,1.8)),Pg(rc(.4,-1,.8,1)),Pg(rc(1.8,-1,.8,1))],
logo:()=>[Pg(ell(2,1.5,2.6,2.6,0,6)),Pg([[2,3.4],[.3,.5],[3.7,.5]]),Pg([[2,.9],[2.7,1.6],[2,2.3],[1.3,1.6]]),Pg(ell(2,1.6,.25,.25,0,16))],
scene:()=>[Pg([[-5,0],[-2,0],[-3.5,3]]),Pg(rc(0,-2,2,2)),Pg(ell(4,1.5,1.2,1.2,0,32))],
custom:()=>{const p=$('cust').value.trim().split(/\s+/).map(s=>s.split(',').map(Number)).filter(a=>a.length===2&&a.every(isFinite));return p.length?[p.length>2?Pg(p):{p}]:[{p:[[0,0]]}]}};
const obj=()=>OBJ[$('obj').value](),verts=()=>obj().flatMap(s=>s.p);
/* ---------- state ---------- */
let ops=[],redo=[],view={s:40,ox:0,oy:0},an={on:false,t:0,P:null,last:0};
const curM=()=>ops.reduce((M,o)=>mul(o.M,M),I3());
const shownM=()=>an.P?mul(buildOp(an.P,an.t),curM()):curM();
function center(){const v=verts().map(p=>ap(curM(),p)),xs=v.map(p=>p[0]),ys=v.map(p=>p[1]);return[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]}
function readP(){const g=id=>+$(id).value,pm=$('pm').value;
 return{type:$('type').value,tx:g('tx'),ty:g('ty'),ang:g('ang'),sx:g('sx'),sy:g('sy'),ref:$('ref').value,shx:g('shx'),shy:g('shy'),pm,pv:pm==='origin'?[0,0]:pm==='center'?center():[g('px'),g('py')]}}
function buildOp(P,t=1){let M;
 switch(P.type){case'translate':return Tm(P.tx*t,P.ty*t);case'rotate':M=Rm(P.ang*t);break;case'scale':M=Sm(1+(P.sx-1)*t,1+(P.sy-1)*t);break;
 case'reflect':M=reflM(P.ref,t);break;default:M=Hm(P.shx*t,P.shy*t)}
 return pivot(M,P.pv)}
function label(P){const pv=P.type==='translate'?'':` about (${f3(P.pv[0])}, ${f3(P.pv[1])})`,R={x:'X-axis',y:'Y-axis',o:'Origin',d:'line y=x'};
 return{translate:`Translation: Tx=${P.tx}, Ty=${P.ty}`,rotate:`Rotation: ${P.ang}°${pv}`,scale:`Scaling: Sx=${P.sx}, Sy=${P.sy}${pv}`,reflect:`Reflection: ${R[P.ref]}${pv}`,shear:`Shearing: ShX=${P.shx}, ShY=${P.shy}${pv}`}[P.type]}
function commit(P){ops.push({P,M:buildOp(P,1),label:label(P)});redo=[]}
/* ---------- drawing ---------- */
function grid(c,W,H,v){c.fillStyle='#0b1220';c.fillRect(0,0,W,H);const st=v.s<22?5:1;
 const x0=Math.floor(-v.ox/v.s),x1=Math.ceil((W-v.ox)/v.s),y0=Math.floor(-(H-v.oy)/v.s),y1=Math.ceil(v.oy/v.s);c.font='10px monospace';c.textAlign='center';
 for(let x=x0;x<=x1;x++){if(x%st)continue;const px=v.ox+x*v.s;c.strokeStyle=x%5?'#182340':'#26355a';c.lineWidth=1;c.beginPath();c.moveTo(px,0);c.lineTo(px,H);c.stroke();if(x){c.fillStyle='#8b98b5';c.fillText(x,px,Math.min(H-3,Math.max(11,v.oy+12)))}}
 for(let y=y0;y<=y1;y++){if(y%st)continue;const py=v.oy-y*v.s;c.strokeStyle=y%5?'#182340':'#26355a';c.beginPath();c.moveTo(0,py);c.lineTo(W,py);c.stroke();if(y){c.fillStyle='#8b98b5';c.textAlign='left';c.fillText(y,Math.min(W-24,Math.max(3,v.ox+4)),py-2);c.textAlign='center'}}
 c.strokeStyle='#cfd8f5';c.lineWidth=2;c.beginPath();c.moveTo(0,v.oy);c.lineTo(W,v.oy);c.moveTo(v.ox,0);c.lineTo(v.ox,H);c.stroke();
 c.fillStyle='#fff';c.font='bold 12px monospace';c.fillText('X',W-10,v.oy-6);c.fillText('Y',v.ox+10,12);c.fillText('O',v.ox-8,v.oy+13)}
function shapes(c,v,M,st){c.save();c.globalAlpha=st.a??1;c.strokeStyle=c.fillStyle=st.col;c.lineWidth=st.lw||2;c.setLineDash(st.dash||[]);
 for(const s of obj()){const q=s.p.map(p=>{const r=ap(M,p);return[v.ox+r[0]*v.s,v.oy-r[1]*v.s]});
  if(q.length===1){c.beginPath();c.arc(q[0][0],q[0][1],5,0,7);c.fill();continue}
  c.beginPath();q.forEach((a,i)=>i?c.lineTo(a[0],a[1]):c.moveTo(a[0],a[1]));if(s.c)c.closePath();
  if(s.c&&st.fill){c.globalAlpha=(st.a??1)*.28;c.fill();c.globalAlpha=st.a??1}c.stroke()}c.restore()}
function scene(c,W,H,v,M,o={}){grid(c,W,H,v);const fill=$('oFill').checked;
 if(o.orig!==false&&$('oShow').checked)shapes(c,v,I3(),{col:'#8b98b5',dash:[6,5],lw:1.5});
 if(o.steps&&$('oSteps').checked){let a=I3();ops.slice(0,-1).forEach((op,i,arr)=>{a=mul(op.M,a);shapes(c,v,a,{col:`hsl(${200+i*40},80%,65%)`,a:.55,dash:[3,3],lw:1.5})})}
 if(o.prev&&$('oPrev').checked&&!an.P){const P=readP();shapes(c,v,mul(buildOp(P),curM()),{col:'#ffb84d',dash:[4,4],lw:1.5});if(P.type!=='translate'){const x=v.ox+P.pv[0]*v.s,y=v.oy-P.pv[1]*v.s;c.strokeStyle='#ff5c7a';c.lineWidth=2;c.beginPath();c.moveTo(x-7,y);c.lineTo(x+7,y);c.moveTo(x,y-7);c.lineTo(x,y+7);c.stroke()}}
 shapes(c,v,M,{col:o.col||'#36e0a0',fill,lw:2.5})}
function fit(cv){const w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h}
function render(){const cv=$('cv');fit(cv);scene(cv.getContext('2d'),cv.width,cv.height,view,shownM(),{steps:1,prev:1})}
/* ---------- panels ---------- */
function refresh(){render();const P=readP(),n=ops.length;
 $('opM').innerHTML=mH(buildOp(P))+`<div class="note">${label(P)}</div>`;$('compM').innerHTML=mH(curM())+`<div class="note">${n} transformation(s) applied</div>`;
 $('t-hist').innerHTML=`<p>Transformation history (${n}) — Undo / Redo / Reset from the left panel. Redo stack: ${redo.length}</p><ul class="h">`+(n?ops.map((o,i)=>`<li class="${i==n-1?'last':''}">${i+1}. ${o.label}</li>`).join(''):'<li>(empty — identity matrix)</li>')+'</ul>';
 let acc=I3(),h=`<p>Original matrix = Identity. Composite: <b>M = ${n?ops.map((_,i)=>'M'+(n-i)).join(' × '):'I'}</b> — M1 is applied first (rightmost matrix touches the point first).</p>`;
 ops.forEach((o,i)=>{const nx=mul(o.M,acc);h+=`<div class="step"><b>M${i+1}</b> — ${o.label}<br>${mH(o.M)} × ${mH(acc)} = ${mH(nx)}</div>`;acc=nx});
 h+=`<div class="step"><b>Final matrix</b>${mH(acc)}</div>`;
 if(P.type!=='translate')h+=`<div class="step"><b>Pending op about pivot (${f3(P.pv[0])}, ${f3(P.pv[1])}):</b> translate to pivot → transform → translate back<br>${mH(Tm(P.pv[0],P.pv[1]))} × ${mH(buildOp({...P,pv:[0,0]}))} × ${mH(Tm(-P.pv[0],-P.pv[1]))} = ${mH(buildOp(P))}</div>`;
 $('t-mat').innerHTML=h;
 const M=buildOp(P),x=+$('ptx').value,y=+$('pty').value,v=[x,y,1],r=[0,1,2].map(i=>M[i][0]*x+M[i][1]*y+M[i][2]);
 $('ptout').textContent=label(P)+'\n\n'+[0,1,2].map(i=>`[ ${M[i].map(f3).join('  ')} ]   [ ${v[i]} ]   ${i==1?'=':' '}   [ ${f3(r[i])} ]`.replace(/\] {3}\[ /,'] ×  [ ')).join('\n')+`\n\nx' = ${f3(M[0][0])}·${x} + ${f3(M[0][1])}·${y} + ${f3(M[0][2])} = ${f3(r[0])}\ny' = ${f3(M[1][0])}·${x} + ${f3(M[1][1])}·${y} + ${f3(M[1][2])} = ${f3(r[1])}`;
 const F=curM(),vs=verts().slice(0,16);$('t-co').innerHTML='<p>Before / after coordinates under the current composite matrix (first 16 vertices)</p><table class="d"><tr><th>#</th><th>Original (x, y)</th><th>Transformed (x\', y\')</th></tr>'+vs.map((p,i)=>{const q=ap(F,p);return`<tr><td>${i+1}</td><td>(${f3(p[0])}, ${f3(p[1])})</td><td>(${f3(q[0])}, ${f3(q[1])})</td></tr>`}).join('')+'</table>';
 compare()}
function compare(){let A=I3(),B=I3();ops.forEach(o=>A=mul(o.M,A));[...ops].reverse().forEach(o=>B=mul(o.M,B));
 for(const[id,M]of[['cA',A],['cB',B]]){const cv=$(id);fit(cv);scene(cv.getContext('2d'),cv.width,cv.height,{s:22,ox:cv.width/2-40,oy:cv.height/2+30},M,{})}
 $('cAm').innerHTML=mH(A);$('cBm').innerHTML=mH(B);const same=A.every((r,i)=>r.every((v,j)=>Math.abs(v-B[i][j])<1e-9));
 $('cmpMsg').textContent=ops.length<2?'Apply at least two transformations (e.g. Translation then Rotation) to compare orders.':same?'Matrices are equal here — these particular operations commute (e.g. two translations, or rotation with uniform scaling).':'Different matrices and different pictures: matrix multiplication is NOT commutative, so transformation order matters.'}
/* ---------- static content ---------- */
const TABS=[['hist','History'],['mat','Matrix Lab'],['pt','Point Lab'],['cmp','Order Comparison'],['co','Coordinates'],['f','Formulas'],['v','Viva']];
$('tabs').innerHTML=TABS.map(t=>`<button data-k="${t[0]}">${t[1]}</button>`).join('');
$('tabs').onclick=e=>{const k=e.target.dataset.k;if(!k)return;document.querySelectorAll('.tab').forEach(d=>d.classList.toggle('on',d.id==='t-'+k));document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));refresh()};
$('t-f').innerHTML=[['Homogeneous coordinates','(x, y) → (x, y, 1);  P\' = M · P  with 3×3 M'],['Translation','x\' = x + Tx,  y\' = y + Ty   M = [1 0 Tx; 0 1 Ty; 0 0 1]'],['Rotation (CCW about origin)','x\' = x cosθ − y sinθ,  y\' = x sinθ + y cosθ'],['Scaling','x\' = Sx·x,  y\' = Sy·y   M = diag(Sx, Sy, 1)'],['Reflection','X-axis: (x, −y) · Y-axis: (−x, y) · Origin: (−x, −y) · y=x: (y, x)'],['Shearing','x\' = x + ShX·y,  y\' = y + ShY·x   M = [1 ShX 0; ShY 1 0; 0 0 1]'],['Pivot / fixed-point','M = T(px,py) · Op · T(−px,−py)'],['Composite','M = Mn × … × M2 × M1  (M1 applied first); in general M2·M1 ≠ M1·M2']].map(a=>`<div class="fm"><b>${a[0]}</b><br>${a[1]}</div>`).join('');
$('t-v').innerHTML=[['What is translation?','Moving every point by a fixed offset (Tx, Ty) without changing shape, size or orientation.'],['What is rotation?','Turning an object by angle θ about a point; positive θ is counter-clockwise. Distances and angles are preserved.'],['What is scaling?','Multiplying coordinates by Sx and Sy. Sx=Sy is uniform; different values give non-uniform scaling; values below 0 also reflect.'],['What is reflection?','Producing a mirror image about a line or point, e.g. the X-axis, Y-axis or origin (a scaling by −1 on the relevant axis).'],['What is shearing?','Slanting an object: x\' = x + ShX·y and y\' = y + ShY·x. Shape distorts but area is preserved when ShX·ShY = 0.'],['What are homogeneous coordinates?','Representing (x, y) as (x, y, 1) so every transformation, including translation, becomes a matrix multiplication.'],['Why are 3×3 matrices used?','A 2×2 matrix cannot represent translation. The third row/column lets translation, rotation, scaling, etc. all be 3×3 matrices that can be concatenated.'],['What is a composite transformation?','A sequence of transformations combined into one matrix by multiplying the individual matrices.'],['Why does transformation order matter?','Matrix multiplication is not commutative. Rotate-then-translate differs from translate-then-rotate (see Order Comparison).'],['What is a pivot point?','The point about which rotation happens: translate pivot to origin, rotate, translate back — T(p)·R·T(−p).'],['What is a fixed point?','The point that stays unchanged during scaling: M = T(f)·S·T(−f).'],['In M = M3×M2×M1 which is applied first?','M1, because the point vector is on the right: P\' = M3(M2(M1·P)).']].map(a=>`<details><summary>${a[0]}</summary>${a[1]}</details>`).join('');
/* ---------- events ---------- */
const showGroup=()=>{document.querySelectorAll('.g').forEach(g=>g.style.display=g.dataset.t===$('type').value?'block':'none');$('pivbox').style.display=$('type').value==='translate'?'none':'block'};
document.querySelectorAll('.sl').forEach(s=>{const o=s.parentElement.querySelector('output'),u=()=>o.textContent=s.value;s.addEventListener('input',u);u()});
document.querySelectorAll('#left input,#left select,#t-pt input').forEach(e=>e.addEventListener('input',()=>{showGroup();refresh()}));
$('apply').onclick=()=>{if(an.P)return;commit(readP());refresh()};
$('undo').onclick=()=>{if(ops.length){redo.push(ops.pop());refresh()}};
$('redo').onclick=()=>{if(redo.length){ops.push(redo.pop());refresh()}};
$('reset').onclick=()=>{ops=[];redo=[];an={on:false,t:0,P:null,last:0};refresh()};
function tick(ts){if(!an.on)return;an.t=Math.min(1,an.t+(ts-an.last)/Math.max(300,+$('dur').value));an.last=ts;
 if(an.t>=1){commit(an.P);an={on:false,t:0,P:null,last:0};refresh()}else{render();requestAnimationFrame(tick)}}
$('play').onclick=()=>{if(!an.P)an={...an,P:readP(),t:0};an.on=true;an.last=performance.now();requestAnimationFrame(tick)};
$('pause').onclick=()=>{an.on=false};
$('arst').onclick=()=>{an={on:false,t:0,P:null,last:0};refresh()};
const cv=$('cv');let drag=null;
cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
 if(drag){view.ox=drag.ox+mx-drag.x;view.oy=drag.oy+my-drag.y;render()}$('cur').textContent=`x = ${((mx-view.ox)/view.s).toFixed(2)}, y = ${((view.oy-my)/view.s).toFixed(2)} · wheel = zoom · drag = pan`};
cv.onmousedown=e=>{const r=cv.getBoundingClientRect();drag={x:e.clientX-r.left,y:e.clientY-r.top,ox:view.ox,oy:view.oy}};
window.onmouseup=()=>drag=null;
cv.onwheel=e=>{e.preventDefault();view.s=Math.min(120,Math.max(10,view.s*(e.deltaY<0?1.1:.9)));render()};
window.onresize=()=>{fit(cv);refresh()};
fit(cv);view.ox=cv.width/2;view.oy=cv.height/2+40;showGroup();$('tabs').querySelector('button').click();
