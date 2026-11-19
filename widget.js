// Embeddable widget: floating button that opens the chat in an iframe.
(function () {
  var s = document.currentScript, tenant = (s && s.dataset.tenant) || 'demo';
  var base = s ? s.src.replace(/widget\.js.*$/, '') : '';
  var b = document.createElement('button');
  b.textContent = 'Chat';
  b.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;padding:12px 18px;border:0;border-radius:99px;background:#059669;color:#fff;font:600 14px system-ui;cursor:pointer';
  var f = document.createElement('iframe');
  f.src = base + '?tenant=' + encodeURIComponent(tenant);
  f.style.cssText = 'display:none;position:fixed;right:20px;bottom:70px;width:380px;height:520px;max-width:calc(100vw - 40px);border:1px solid #ccc;border-radius:12px;z-index:99999;background:#fff';
  b.onclick = function () { f.style.display = f.style.display === 'none' ? 'block' : 'none'; };
  document.body.append(f, b);
})();
