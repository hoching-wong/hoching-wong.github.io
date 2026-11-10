(function(){
  var root=document.documentElement,btn=document.getElementById('theme');
  function dark(){return root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  var SUN='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function label(){btn.innerHTML=dark()?SUN:MOON;btn.setAttribute('aria-label',dark()?'Switch to light mode':'Switch to dark mode')}
  btn.addEventListener('click',function(){
    var next=dark()?'light':'dark';
    function apply(){root.dataset.theme=next;label()}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){apply();return}
    if(document.startViewTransition){document.startViewTransition(apply)}   /* smooth cross-fade of the whole page, scene and sky included */
    else{root.classList.add('theme-fade');apply();setTimeout(function(){root.classList.remove('theme-fade')},450)}   /* fallback: fade colours */
  });
  label();
  document.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(){
    var d=document.getElementById(b.dataset.open);
    if(!d)return;
    if(d.showModal){d.showModal()}else{d.setAttribute('open','')}
  })});
  document.querySelectorAll('dialog').forEach(function(d){
    d.addEventListener('click',function(e){if(e.target===d)d.close()});
    d.querySelectorAll('[data-close]').forEach(function(c){c.addEventListener('click',function(){d.close()})});
  });
  document.querySelectorAll('.shot img').forEach(function(i){
    function gone(){i.remove()}
    i.addEventListener('error',gone);
    if(i.complete&&i.naturalWidth===0)gone();
  });
})();


/* cursor trail: tiny code symbols (0/1, braces, brackets, operators) that appear (one every ~70ms of mouse movement), drift down and fade out.
   Desktop pointers only; off for reduced motion. */
(function(){
  if(!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var root=document.documentElement;
  var c=document.createElement('canvas'),ctx=c.getContext('2d');
  c.setAttribute('aria-hidden','true');
  c.style.cssText='position:fixed;left:0;top:0;pointer-events:none;z-index:9999';
  document.body.appendChild(c);
  var W,H,DPR;
  /* Size the canvas to the page area WITHOUT the scrollbar, in exact pixels, so 1 canvas px = 1 mouse px.
     (Using innerWidth squeezed the drawing left by the scrollbar's width.) */
  function size(){DPR=Math.min(window.devicePixelRatio||1,2);W=root.clientWidth;H=root.clientHeight;c.style.width=W+'px';c.style.height=H+'px';c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0)}
  size();addEventListener('resize',size);
  var FONT='Consolas,"SF Mono","JetBrains Mono","Fira Code",Menlo,monospace';
  var GLYPHS=['0','1','0','1','0','1','0','1','{','}','<','>','/',';','=','(',')','[',']','#','&','|','</>','=>','//','&&','()','[]','{}','!=','++','::'];
  var NIGHT=['#6a90f0','#8fb0ff','#a9c0ff','#5ad0ff','#ffffff'],DAY=['#1d3a85','#2457c5','#3a4668','#2a7a72'];
  var RED_N='#e0524a',RED_D='#c9432f';      /* an occasional hanko-red character */
  var EVERY=70,MAX=30;   /* at most one character every ~70ms while the mouse moves, spawned exactly at the pointer position */
  var FLICKER=false;   /* true: characters keep changing while they fade */
  var FALL=true;       /* true: characters drift downward while they fade */
  var parts=[],running=false,lastFrame=0,ink={};
  function glyph(){return GLYPHS[(Math.random()*GLYPHS.length)|0]}
  function spawn(x,y){
    var night=root.dataset.theme!=='light',pal=night?NIGHT:DAY;
    var col=Math.random()<.11?(night?RED_N:RED_D):pal[(Math.random()*pal.length)|0];   /* ~1 in 9 is hanko red */
    parts.push({x:x,y:y,vx:FALL?(Math.random()-.5)*.2:0,vy:FALL?.45+Math.random()*.4:0,   /* starts exactly on the cursor tip */
      size:8+Math.random()*2.5,born:performance.now(),life:380+Math.random()*320,ch:glyph(),col:col,night:night});
    if(parts.length>MAX)parts.shift();
  }
  function frame(now){
    if(root.clientWidth!==W||root.clientHeight!==H)size();   /* e.g. a scrollbar appeared or disappeared */
    ctx.clearRect(0,0,W,H);
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
    var dt=lastFrame?Math.min(50,now-lastFrame):16.7;lastFrame=now;var k=dt/16.7;   /* movement is per-time, so it looks the same at any frame rate */
    for(var i=parts.length-1;i>=0;i--){
      var p=parts[i],t=(now-p.born)/p.life;
      if(t>=1){parts.splice(i,1);continue}
      if(FLICKER&&Math.random()<.1)p.ch=glyph();
      ctx.globalAlpha=.7*(1-t);                          /* starts at 70% opacity, fades evenly (linear) to 0, then is removed */
      var sz=Math.round(p.size);
      ctx.font='700 '+sz+'px '+FONT;
      ctx.fillStyle=p.col;
      if(p.night){ctx.shadowColor=p.col;ctx.shadowBlur=6}else{ctx.shadowBlur=0}
      /* centre the character's actual drawn shape (not its text box) on (p.x,p.y) */
      var key=sz+p.ch,m=ink[key];
      if(!m){var tm=ctx.measureText(p.ch);m=ink[key]={x:(tm.actualBoundingBoxRight-tm.actualBoundingBoxLeft)/2,y:(tm.actualBoundingBoxDescent-tm.actualBoundingBoxAscent)/2}}
      ctx.fillText(p.ch,p.x-m.x,p.y-m.y);
      p.x+=p.vx*k;p.y+=p.vy*k;                           /* move after drawing, so the first frame is exactly on the tip */
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(parts.length){requestAnimationFrame(frame)}else{running=false;lastFrame=0}
  }
  function kick(){if(!running){running=true;requestAnimationFrame(frame)}}
  var lastT=0;
  addEventListener('pointermove',function(e){
    if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
    var now=performance.now();
    if(now-lastT<EVERY)return;                           /* time-based: at most one character per EVERY ms */
    lastT=now;
    spawn(e.clientX,e.clientY);kick();                   /* exactly where the pointer is */
  },{passive:true});
})();
