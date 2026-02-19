(function() {
  var content = document.querySelector('.docs-content');
  var tocNav = document.getElementById('docs-toc-nav');
  var tocWrapper = document.getElementById('docs-toc-wrapper');
  var tocToggle = document.querySelector('.docs-toc-toggle');
  if (!content || !tocNav || !tocWrapper) return;

  var headings = content.querySelectorAll('h2, h3');
  if (headings.length < 2) {
    tocWrapper.classList.add('is-empty');
    return;
  }

  var ul = document.createElement('ul');
  ul.className = 'docs-toc-list';
  var currentUl = ul;
  var stack = [ul];

  headings.forEach(function(h) {
    var id = h.id;
    if (!id) return;
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent.trim();
    a.className = 'docs-toc-link';
    a.setAttribute('data-heading-id', id);
    li.appendChild(a);

    if (h.tagName === 'H2') {
      while (stack.length > 1) stack.pop();
      currentUl = stack[stack.length - 1];
      currentUl.appendChild(li);
    } else {
      var lastLi = currentUl.querySelector('li:last-child');
      if (lastLi) {
        var nestedUl = lastLi.querySelector('ul');
        if (!nestedUl) {
          nestedUl = document.createElement('ul');
          nestedUl.className = 'docs-toc-list docs-toc-sublist';
          lastLi.appendChild(nestedUl);
          stack.push(nestedUl);
        }
        nestedUl.appendChild(li);
      } else {
        currentUl.appendChild(li);
      }
    }
  });

  tocNav.appendChild(ul);

  var toTopLi = document.createElement('li');
  toTopLi.className = 'docs-toc-to-top';
  var toTopLink = document.createElement('a');
  toTopLink.href = '#';
  toTopLink.textContent = 'To top';
  toTopLink.className = 'docs-toc-link docs-to-top';
  toTopLink.setAttribute('aria-label', 'Scroll to top');
  toTopLi.appendChild(toTopLink);
  ul.appendChild(toTopLi);

  tocWrapper.classList.remove('is-empty');

  if (tocToggle) {
    tocToggle.addEventListener('click', function() {
      var expanded = tocWrapper.classList.toggle('is-expanded');
      tocToggle.setAttribute('aria-expanded', expanded);
    });
  }

  function updateActive() {
    var links = tocNav.querySelectorAll('.docs-toc-link[data-heading-id]');
    var headerHeight = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 60;
    var threshold = headerHeight + 80;

    var activeId = null;
    headings.forEach(function(h) {
      var el = document.getElementById(h.id);
      if (el && el.getBoundingClientRect().top <= threshold) {
        activeId = h.id;
      }
    });

    links.forEach(function(link) {
      if (link.getAttribute('data-heading-id') === activeId) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  window.addEventListener('scroll', function() {
    requestAnimationFrame(updateActive);
  }, { passive: true });
  updateActive();
})();
