// spotlight + custom cursor (skipped entirely on touch/coarse-pointer devices,
// where the ring/dot are also CSS-hidden — no point burning CPU animating them)
const isFinePointer = !window.matchMedia('(pointer: coarse)').matches;

if (isFinePointer) {
  const spotlight = document.getElementById('spotlight');
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let ringX = window.innerWidth / 2, ringY = window.innerHeight / 2;
  let mouseX = ringX, mouseY = ringY;

  dot.style.left = mouseX + 'px';
  dot.style.top = mouseY + 'px';

  // just record the pointer position here; all style writes happen once per
  // frame in animateRing() below instead of on every raw mousemove event
  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateRing(){
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
    spotlight.style.setProperty('--spot-x', mouseX + 'px');
    spotlight.style.setProperty('--spot-y', mouseY + 'px');
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, .card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}

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

// section tracking: the single source of truth for "which section is active",
// shared by the side-nav dots and the wheel-driven full-page navigation below
// (previously the wheel handler kept its own counter, which desynced from
// reality whenever the user scrolled by any means other than the wheel, e.g.
// dragging the scrollbar thumb)
const sectionsArr = [...document.querySelectorAll('section')];
const navLinkById = new Map(
  [...document.querySelectorAll('#dotNav a')].map(link => [link.getAttribute('href').slice(1), link])
);
let activeIndex = 0;

const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const link = navLinkById.get(entry.target.id);
    if (!link) return;
    navLinkById.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    activeIndex = sectionsArr.indexOf(entry.target);
    // remember where we are so a browser back-navigation (e.g. from a
    // project detail page) can restore this spot instead of resetting
    // to the top — see the restore block right after this observer setup
    sessionStorage.setItem('lastSection', entry.target.id);
  });
}, { root: snapWrap, threshold: 0.5 });
sectionsArr.forEach(s => navObserver.observe(s));

// restore scroll position on load: this covers both the "← 프로젝트 목록으로"
// link (which sets #hash) and a plain browser back-button press (which
// carries no hash but still needs the same fix, since snapWrap's scrollTop
// isn't part of what the browser restores on its own here)
{
  const targetId = (location.hash || '').slice(1) || sessionStorage.getItem('lastSection');
  if (targetId) {
    const idx = sectionsArr.findIndex(s => s.id === targetId);
    if (idx > 0) {
      // jump instantly (no animation) — this runs before first paint settles,
      // an animated scroll here would just look like a flash/jump anyway
      const target = sectionsArr[idx];
      snapWrap.scrollTop = target.offsetTop;
      activeIndex = idx;
    }
  }
}

navLinkById.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    goTo(sectionsArr.findIndex(s => '#' + s.id === link.getAttribute('href')));
  });
});

// full-page section jump, animated by hand (instead of scrollIntoView) so the
// motion has a consistent, controllable duration/easing regardless of browser
const SCROLL_DURATION = 800;
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
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
  if (index < 0 || index >= sectionsArr.length || animating) return;
  animating = true;
  const target = sectionsArr[index];
  const targetY = snapWrap.scrollTop + target.getBoundingClientRect().top - snapWrap.getBoundingClientRect().top;
  animateScrollTo(targetY, SCROLL_DURATION);
  setTimeout(() => { animating = false; }, SCROLL_DURATION);
}

// one wheel "tick" jumps a whole section, but only once the active section has
// no more room left to scroll in that direction — otherwise native scrolling
// is left alone so content taller than one viewport can still be reached
snapWrap.addEventListener('wheel', e => {
  if (e.deltaY === 0) return;
  if (animating){ e.preventDefault(); return; }

  const rect = sectionsArr[activeIndex].getBoundingClientRect();
  const atBottom = rect.bottom <= window.innerHeight + 1;
  const atTop = rect.top >= -1;
  if (e.deltaY > 0 && !atBottom) return;
  if (e.deltaY < 0 && !atTop) return;

  e.preventDefault();
  goTo(activeIndex + (e.deltaY > 0 ? 1 : -1));
}, { passive: false });
