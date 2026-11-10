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
  c.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(c);
  var W,H,DPR;
  function size(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*DPR;c.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
  size();addEventListener('resize',size);
  var FONT='Consolas,"SF Mono","JetBrains Mono","Fira Code",Menlo,monospace';
  var GLYPHS=['0','1','0','1','0','1','0','1','{','}','<','>','/',';','=','(',')','[',']','#','&','|','</>','=>','//','&&','()','[]','{}','!=','++','::'];
  var NIGHT=['#6a90f0','#8fb0ff','#a9c0ff','#5ad0ff','#ffffff'],DAY=['#1d3a85','#2457c5','#3a4668','#2a7a72'];
  var RED_N='#e0524a',RED_D='#c9432f';      /* an occasional hanko-red character */
  var EVERY=70,MIN_MOVE=6,MAX=30;   /* one character every ~70ms while the mouse is moving (and it must have moved a few px) */
  var FLICKER=false;   /* true: characters keep changing while they fade */
  var FALL=true;       /* true: characters drift downward while they fade */
  var parts=[],running=false,lx=null,ly=null,lastFrame=0;
  function glyph(){return GLYPHS[(Math.random()*GLYPHS.length)|0]}
  function spawn(x,y){
    var night=root.dataset.theme!=='light',pal=night?NIGHT:DAY;
    var col=Math.random()<.11?(night?RED_N:RED_D):pal[(Math.random()*pal.length)|0];   /* ~1 in 9 is hanko red */
    parts.push({x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*8,vx:FALL?(Math.random()-.5)*.2:0,vy:FALL?.45+Math.random()*.4:0,
      size:8+Math.random()*2.5,born:performance.now(),life:380+Math.random()*320,ch:glyph(),col:col,night:night});
    if(parts.length>MAX)parts.shift();
  }
  function frame(now){
    ctx.clearRect(0,0,W,H);
    ctx.textAlign='center';ctx.textBaseline='middle';
    var dt=lastFrame?Math.min(50,now-lastFrame):16.7;lastFrame=now;var k=dt/16.7;   /* movement is per-time, so it looks the same at any frame rate */
    for(var i=parts.length-1;i>=0;i--){
      var p=parts[i],t=(now-p.born)/p.life;
      if(t>=1){parts.splice(i,1);continue}
      p.x+=p.vx*k;p.y+=p.vy*k;
      if(FLICKER&&Math.random()<.1)p.ch=glyph();
      ctx.globalAlpha=.7*(1-t);                          /* starts at 70% opacity, fades evenly (linear) to 0, then is removed */
      ctx.font='700 '+Math.round(p.size)+'px '+FONT;
      ctx.fillStyle=p.col;
      if(p.night){ctx.shadowColor=p.col;ctx.shadowBlur=6}else{ctx.shadowBlur=0}
      ctx.fillText(p.ch,p.x,p.y);
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;
    if(parts.length){requestAnimationFrame(frame)}else{running=false;lastFrame=0}
  }
  function kick(){if(!running){running=true;requestAnimationFrame(frame)}}
  var lastT=0;
  addEventListener('pointermove',function(e){
    if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
    var now=performance.now(),x=e.clientX,y=e.clientY;
    if(lx===null){lx=x;ly=y;lastT=now;return}
    if(now-lastT<EVERY)return;                           /* time-based: at most one character per EVERY ms */
    if(Math.abs(x-lx)+Math.abs(y-ly)<MIN_MOVE)return;    /* ...and only if the cursor actually moved */
    lastT=now;lx=x;ly=y;
    spawn(x,y);kick();
  },{passive:true});
  document.addEventListener('mouseleave',function(){lx=null;ly=null});
})();
