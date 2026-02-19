(function() {
  if (window.installCommandInit) return;
  window.installCommandInit = true;

  document.querySelectorAll('.install-command').forEach(function(block) {
    var btn = block.querySelector('.copy-btn');
    var input = block.querySelector('input[type="text"]');
    if (btn && input) {
      btn.addEventListener('click', function() {
        navigator.clipboard.writeText(input.value).then(function() {
          var span = btn.querySelector('span');
          if (span) { span.textContent = 'Copied!'; }
          setTimeout(function() { if (span) span.textContent = 'Copy'; }, 1500);
        });
      });
    }
  });
})();
