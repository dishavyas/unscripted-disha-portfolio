'use strict';
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(pointer:fine)');
const scenery=document.querySelector('.scenery');
const traveler=document.querySelector('#traveler');
const progress=document.querySelector('#progress');
const toggle=document.querySelector('#motionToggle');
const sections=[...document.querySelectorAll('.chapter')];
const names=['Somewhere between a dream & a story','The story cottage · Mythology & mysteries','The scenic route · Sacred places','At home · A little more about me'];
const anchors=['home','stories','journeys','about'];
let paused=reduceMotion.matches,frameId=0,lastTime=0,lastParticleTime=0,clock=0;
let width=innerWidth,height=innerHeight,targetProgress=0,renderProgress=0;
let pointerX=0,pointerY=0,smoothX=0,smoothY=0,currentChapter=-1,dirty=true,walkingUntil=0;
const canvas=document.createElement('canvas');canvas.className='motion-canvas';canvas.setAttribute('aria-hidden','true');document.querySelector('.world').append(canvas);
const ctx=canvas.getContext('2d');
const motes=Array.from({length:24},(_,i)=>({x:(i*.61803398875)%1,y:(i*.41421356)%1,r:1+i%3,phase:i*1.9,speed:.008+(i%5)*.003}));
const sparks=[];
function measure(){width=innerWidth;height=innerHeight;if(ctx){const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0)}dirty=true;requestFrame()}
function updateNavigation(){const max=Math.max(1,document.documentElement.scrollHeight-height);targetProgress=Math.max(0,Math.min(1,scrollY/max));progress.style.width=`${targetProgress*100}%`;let active=0;sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<height*.5)active=i});if(currentChapter===active)return;currentChapter=active;document.querySelector('#sceneNumber').textContent=String(active+1).padStart(2,'0');document.querySelector('#locationName').textContent=names[active];document.querySelectorAll('nav a').forEach((a,i)=>{a.classList.toggle('active',i===active);if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});document.querySelectorAll('.journey-nav a').forEach((a,i)=>a.classList.toggle('selected',i===active));document.querySelector('#scrollHint').href='#'+anchors[(active+1)%4]}
function drawParticles(time,dt){if(!ctx)return;ctx.clearRect(0,0,width,height);motes.forEach(m=>{const x=m.x*width+Math.sin(clock*.35+m.phase)*30,y=((m.y-clock*m.speed)%1+1)%1*height;ctx.beginPath();ctx.fillStyle=`rgba(255,242,220,${.25+(Math.sin(clock*1.3+m.phase)+1)*.2})`;ctx.arc(x,y,m.r,0,Math.PI*2);ctx.fill()});for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.life-=dt*1.25;s.y-=dt*15;if(s.life<=0){sparks.splice(i,1);continue}ctx.strokeStyle=`rgba(255,242,245,${s.life*.8})`;ctx.beginPath();ctx.moveTo(s.x-s.r*s.life,s.y);ctx.lineTo(s.x+s.r*s.life,s.y);ctx.moveTo(s.x,s.y-s.r*s.life);ctx.lineTo(s.x,s.y+s.r*s.life);ctx.stroke()}}
function requestFrame(){if(!frameId&&!document.hidden)frameId=requestAnimationFrame(animate)}
function animate(time){frameId=0;const dt=Math.min((time-lastTime)/1000||.016,.05);lastTime=time;if(dirty){updateNavigation();dirty=false}if(paused)return;clock+=dt;const easing=1-Math.exp(-dt*9);renderProgress+=(targetProgress-renderProgress)*easing;smoothX+=(pointerX-smoothX)*easing;smoothY+=(pointerY-smoothY)*easing;const p=renderProgress,mobile=width<651;scenery.style.transform=`translate3d(${Math.sin(p*Math.PI*1.6)*(mobile?-2:-3)}%,${-p*2}%,0) translate(${smoothX*-10}px,${smoothY*-6}px) scale(${1.08+p*.12})`;traveler.style.transform=`translate3d(${Math.sin(p*Math.PI*2)*(mobile?12:80)+smoothX*12}px,${Math.sin(p*Math.PI*3)*12+smoothY*6}px,0) scale(${1-p*.08})`;document.body.classList.toggle('is-walking',time<walkingUntil);if(time-lastParticleTime>=32){drawParticles(time,(time-lastParticleTime)/1000);lastParticleTime=time}requestFrame()}
function syncMotion(){document.body.classList.toggle('paused',paused);document.documentElement.classList.toggle('motion-paused',paused);toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Resume animations':'Pause animations');toggle.innerHTML=paused?'<span>▷</span> Resume motion':'<span>Ⅱ</span> Pause motion';if(paused){cancelAnimationFrame(frameId);frameId=0;document.body.classList.remove('is-walking');sparks.length=0;if(ctx)ctx.clearRect(0,0,width,height)}else{pointerX=pointerY=smoothX=smoothY=0;lastTime=lastParticleTime=performance.now()}dirty=true;requestFrame()}
toggle.addEventListener('click',()=>{paused=!paused;syncMotion()});reduceMotion.addEventListener('change',e=>{paused=e.matches;syncMotion()});
window.addEventListener('scroll',()=>{dirty=true;if(!paused)walkingUntil=performance.now()+180;requestFrame()},{passive:true});
window.addEventListener('resize',measure,{passive:true});
window.addEventListener('pointermove',e=>{if(paused||!finePointer.matches)return;pointerX=(e.clientX/width-.5)*2;pointerY=(e.clientY/height-.5)*2;if(sparks.length<24)sparks.push({x:e.clientX,y:e.clientY,life:1,r:2+Math.random()*2})},{passive:true});
document.addEventListener('pointerleave',()=>{pointerX=pointerY=0});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frameId);frameId=0;if(!document.hidden){lastTime=lastParticleTime=performance.now();dirty=true;requestFrame()}});
// Reveal once: returning to a chapter never makes its text disappear.
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}})},{threshold:0,rootMargin:'0px 0px 80px 0px'});sections.forEach(s=>observer.observe(s));sections[0].classList.add('in-view');document.body.classList.add('motion-ready')}
for(let i=0;i<10;i++){const petal=document.createElement('i');petal.className='petal';petal.style.left=`${(i*37)%100}%`;petal.style.animationDuration=`${16+i%7*3}s`;petal.style.animationDelay=`-${i*2.1}s`;document.querySelector('#particles').append(petal)}
measure();updateNavigation();renderProgress=targetProgress;syncMotion();
