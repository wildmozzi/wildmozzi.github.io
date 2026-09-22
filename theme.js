// light/dark theme toggle. The actual theme value is set as early as
// possible by a small inline script in <head> (see index.html etc.) so the
// page never flashes the wrong theme on load — this file only wires up the
// button's click handler and keeps its icon/label in sync afterward.
(function () {
  const btn = document.querySelector('.theme-toggle')
  if (!btn) return

  function paintButton(theme) {
    btn.textContent = theme === 'light' ? '🌙' : '☀️'
    btn.setAttribute(
      'aria-label',
      theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'
    )
  }

  paintButton(document.documentElement.getAttribute('data-theme') || 'dark')

  btn.addEventListener('click', () => {
    const next =
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'dark'
        : 'light'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next) // persists the choice across pages
    paintButton(next)
  })
})()
