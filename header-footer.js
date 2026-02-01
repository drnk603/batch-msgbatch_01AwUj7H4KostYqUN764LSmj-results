(function () {
  var header = document.querySelector('.dr-header');
  if (!header) return;

  var toggle = header.querySelector('.dr-nav-toggle');
  var nav = header.querySelector('.dr-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    var nextState = !isExpanded;
    toggle.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      nav.classList.add('is-open');
    } else {
      nav.classList.remove('is-open');
    }
  });
})();