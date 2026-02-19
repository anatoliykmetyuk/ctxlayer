(function() {
  var btn = document.querySelector('.docs-to-top');
  if (!btn) return;

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
