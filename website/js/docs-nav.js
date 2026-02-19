(function() {
  var toggle = document.querySelector('.docs-nav-toggle');
  var sidebar = document.getElementById('docs-nav-menu');
  if (toggle && sidebar) {
    function closeMenu() {
      sidebar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function() {
      var isOpen = sidebar.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
    sidebar.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) closeMenu();
    });
  }
})();
