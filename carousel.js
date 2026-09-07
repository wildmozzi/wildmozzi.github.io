// simple dot-carousel: one photo visible at a time, auto-advances, and the
// dots below let you jump straight to any photo. Left/right arrows move one
// photo at a time. Everything wraps around (last -> first, first -> last) —
// there's no dead end in either direction.
// Works for any number of slides — dots are generated to match however many
// .carousel-slide elements are inside the track, so adding/removing photos
// needs no JS edits.
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track')
  const slides = Array.from(track.children)
  const dotsWrap = carousel.querySelector('.carousel-dots')
  const prevBtn = carousel.querySelector('.carousel-arrow.prev')
  const nextBtn = carousel.querySelector('.carousel-arrow.next')
  let index = 0
  let timer

  slides.forEach((_, i) => {
    const dot = document.createElement('button')
    dot.setAttribute('aria-label', `${i + 1}번째 사진 보기`)
    if (i === 0) dot.classList.add('active')
    dot.addEventListener('click', () => goTo(i, true))
    dotsWrap.appendChild(dot)
  })
  const dots = Array.from(dotsWrap.children)

  function goTo(i, manual) {
    index = i
    track.style.transform = `translateX(-${i * 100}%)`
    dots.forEach(d => d.classList.remove('active'))
    dots[i].classList.add('active')
    if (manual) restart() // manual interaction resets the auto-advance timer
  }
  // (index + 1) or (index - 1) can land outside [0, slides.length) by one
  // step in either direction — the extra "+ slides.length" before the final
  // modulo keeps it wrapping cleanly even on the backward step, since JS's
  // % can otherwise return a negative number for e.g. (0 - 1) % 5.
  function step(delta, manual) {
    goTo((index + delta + slides.length) % slides.length, manual)
  }

  if (prevBtn) prevBtn.addEventListener('click', () => step(-1, true))
  if (nextBtn) nextBtn.addEventListener('click', () => step(1, true))

  function restart() {
    clearInterval(timer)
    timer = setInterval(() => step(1), 4000)
  }

  restart()
  // pause while the mouse is over it so it doesn't advance mid-read
  carousel.addEventListener('mouseenter', () => clearInterval(timer))
  carousel.addEventListener('mouseleave', restart)
})
