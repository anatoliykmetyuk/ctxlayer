(function() {
  document.querySelectorAll('.docs-to-top').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
})();
