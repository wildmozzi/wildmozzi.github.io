// spotlight + custom cursor
const spotlight = document.getElementById('spotlight');
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let ringX = window.innerWidth/2, ringY = window.innerHeight/2;
let mouseX = ringX, mouseY = ringY;

window.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  spotlight.style.setProperty('--spot-x', mouseX + 'px');
  spotlight.style.setProperty('--spot-y', mouseY + 'px');
  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';
});

function animateRing(){
  ringX += (mouseX - ringX) * 0.15;
  ringY += (mouseY - ringY) * 0.15;
  ring.style.left = ringX + 'px';
  ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, .card').forEach(el => {
  el.addEventListener('mouseenter', () => ring.classList.add('hover'));
  el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
});

// scroll reveal (root = the actual scrolling container, not the window)
const snapWrap = document.getElementById('snapWrap');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('visible', entry.isIntersecting);
  });
}, { root: snapWrap, threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 6) * 0.06 + 's';
  revealObserver.observe(el);
});

// side nav active state
const navLinks = document.querySelectorAll('#dotNav a');
const sections = document.querySelectorAll('section');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const link = document.querySelector(`#dotNav a[href="#${entry.target.id}"]`);
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}, { root: snapWrap, threshold: 0.5 });
sections.forEach(s => navObserver.observe(s));

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const idx = [...sections].findIndex(s => '#' + s.id === link.getAttribute('href'));
    goTo(idx);
  });
});

// one wheel "tick" = jump straight to the next/previous section (no waiting
// for trackpad momentum to settle, which is what native CSS scroll-snap does),
// animated by hand so the scroll motion itself is always visible and consistent
const SCROLL_DURATION = 800;
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

let current = 0;
let animating = false;

function animateScrollTo(targetY, duration){
  const startY = snapWrap.scrollTop;
  const diff = targetY - startY;
  const startTime = performance.now();

  function step(now){
    const progress = Math.min((now - startTime) / duration, 1);
    snapWrap.scrollTop = startY + diff * easeInOutCubic(progress);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function goTo(index){
  if (index < 0 || index >= sections.length || animating) return;
  animating = true;
  current = index;
  const target = sections[index];
  const targetY = snapWrap.scrollTop + target.getBoundingClientRect().top - snapWrap.getBoundingClientRect().top;
  animateScrollTo(targetY, SCROLL_DURATION);
  setTimeout(() => { animating = false; }, SCROLL_DURATION);
}

snapWrap.addEventListener('wheel', e => {
  e.preventDefault();
  if (animating) return;
  if (e.deltaY > 0) goTo(current + 1);
  else if (e.deltaY < 0) goTo(current - 1);
}, { passive: false });
