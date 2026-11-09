(function(){
  var root=document.documentElement,btn=document.getElementById('theme');
  function dark(){return root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  var SUN='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function label(){btn.innerHTML=dark()?SUN:MOON;btn.setAttribute('aria-label',dark()?'Switch to light mode':'Switch to dark mode')}
  btn.addEventListener('click',function(){root.dataset.theme=dark()?'light':'dark';label()});
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
