const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
function updateTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  document.getElementById('theme-color').content = theme === 'dark' ? '#0f111d' : '#f2f4fc';
}
updateTheme(root.dataset.theme);
themeToggle.addEventListener('click', () => {
  const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  updateTheme(theme);
  try { localStorage.setItem('theme', theme); } catch { /* Theme still works without storage. */ }
});
systemTheme.addEventListener('change', event => {
  try { if (localStorage.getItem('theme')) return; } catch { /* Follow the system if storage is unavailable. */ }
  updateTheme(event.matches ? 'dark' : 'light');
});
window.addEventListener('storage', event => {
  if (event.key === 'theme') updateTheme(event.newValue === 'dark' || (!event.newValue && systemTheme.matches) ? 'dark' : 'light');
});

// Hoardalytics example, modeled on the app's "Your Color Palette": colors are grouped into
// families, the selected segment grows outward, and the rest dim.
(() => {
  const card = document.querySelector('.chart-example');
  if (!card) return;
  const segs = [...card.querySelectorAll('.seg')];
  const swatches = [...card.querySelectorAll('.swatch')];
  const tiles = card.querySelector('.palette-tiles');
  const counts = swatches.map(item => Number(item.dataset.count));
  const total = counts.reduce((sum, value) => sum + value, 0);
  const SVG = 'http://www.w3.org/2000/svg';
  const CX = 100, INNER = 63.5, OUTER = 92, UNSELECTED = OUTER * 0.92, INSET = 5, GAP = 3;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const point = (r, deg) => [CX + r * Math.cos((deg - 90) * Math.PI / 180), CX + r * Math.sin((deg - 90) * Math.PI / 180)];
  const deg = rad => rad * 180 / Math.PI;
  function sector(a0, a1, ri, ro) {
    ro -= INSET; ri += INSET;
    const dOut = deg((GAP / 2 + INSET) / ro), dIn = deg((GAP / 2 + INSET) / ri);
    const [x1, y1] = point(ro, a0 + dOut), [x2, y2] = point(ro, a1 - dOut);
    const [x3, y3] = point(ri, a1 - dIn), [x4, y4] = point(ri, a0 + dIn);
    const large = (a1 - dOut) - (a0 + dOut) > 180 ? 1 : 0;
    return `M${x1} ${y1}A${ro} ${ro} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${ri} ${ri} 0 ${large} 0 ${x4} ${y4}Z`;
  }
  const spans = [];
  counts.reduce((start, count) => {
    const end = start + (360 * count) / total;
    spans.push([start, end]);
    return end;
  }, 0);
  const radii = segs.map((seg, i) => (seg.classList.contains('is-active') ? OUTER : UNSELECTED));
  function animateRadius(i, target) {
    const from = radii[i];
    if (reduceMotion || from === target) {
      radii[i] = target;
      segs[i].setAttribute('d', sector(...spans[i], INNER, target));
      return;
    }
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / 320, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      radii[i] = from + (target - from) * eased;
      segs[i].setAttribute('d', sector(...spans[i], INNER, radii[i]));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function select(index, { scroll = false } = {}) {
    swatches.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      item.setAttribute('aria-pressed', String(i === index));
    });
    segs.forEach((seg, i) => {
      seg.classList.toggle('is-active', i === index);
      animateRadius(i, i === index ? OUTER : UNSELECTED);
    });
    const swatch = swatches[index];
    const count = counts[index];
    card.style.setProperty('--c', swatch.dataset.color);
    card.querySelector('.palette-pct').textContent = `${Math.round((count / total) * 100)}%`;
    card.querySelector('.palette-name').textContent = swatch.dataset.name;
    card.querySelector('.palette-count').textContent = `${count} ${count === 1 ? 'device' : 'devices'}`;
    tiles.replaceChildren(...swatch.dataset.devices.split('|').map(entry => {
      const [name, type, hex] = entry.split(':');
      const tile = document.createElement('span');
      tile.className = 'palette-tile';
      tile.style.setProperty('--c', `#${hex}`);
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'mock');
      svg.setAttribute('viewBox', '0 0 80 80');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(SVG, 'use');
      use.setAttribute('href', `#mock-${type}`);
      svg.append(use);
      const label = document.createElement('span');
      label.textContent = name;
      tile.append(svg, label);
      return tile;
    }));
    if (scroll) swatch.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
  swatches.forEach((swatch, i) => swatch.addEventListener('click', () => select(i)));
  segs.forEach((seg, i) => seg.addEventListener('click', () => select(i, { scroll: true })));
  select(0);
})();

// Hoardshelf example: show the visitor's own time and date, like the real lock screen.
(() => {
  const clock = document.querySelector('.duo-clock');
  const date = document.querySelector('.duo-date');
  if (!clock || !date) return;
  const update = () => {
    const now = new Date();
    clock.textContent = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
    date.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };
  update();
  setInterval(update, 15000);
})();

// Release alerts demo: the three notifications arrive once, the first time the card is scrolled into view.
(() => {
  const stack = document.querySelector('.alert-stack');
  if (!stack || !('IntersectionObserver' in window)) return;
  stack.classList.add('is-pending');
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    stack.classList.add('is-in');
    observer.disconnect();
  }, { threshold: 0.6 });
  observer.observe(stack);
})();

// Siri pill demo: like swiping down on iOS, a black blob stretches out of the card's top edge on a thin neck,
// the neck pinches off, and the pill settles with a bounce. Then it shows "Search or Ask" and types a question.
// Plays once, the first time the card is scrolled into view.
(() => {
  const pill = document.querySelector('.siri-pill');
  const card = pill?.closest('.feature');
  if (!pill || !card || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const NS = 'http://www.w3.org/2000/svg';
  const line = pill.querySelector('.siri-line');
  const text = pill.querySelector('.siri-text');
  const mic = pill.querySelector('.siri-mic');
  // Three examples, each with shorter fallbacks for narrow pills. They match real Siri/Shortcuts actions:
  // Check for Updates, Find Devices and Get Collection Summary.
  const examples = [
    [text.textContent, 'Any iPhone updates?', 'iPhone updates?'],
    ['Find my iPods in Hoardware', 'Find my iPods', 'Find iPods'],
    ['How many devices do I own?', 'How many devices?', 'Device count?']
  ];
  const pickQuestion = candidates => {
    const context = document.createElement('canvas').getContext('2d');
    const style = getComputedStyle(text);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const room = text.parentElement.clientWidth - 8; // leave space for the cursor
    return candidates.find(candidate => context.measureText(candidate).width <= room) ?? candidates[candidates.length - 1];
  };
  const DURATION = 1150;
  pill.classList.add('is-pending');

  const type = (question, done) => {
    let i = 0;
    const step = () => {
      text.textContent = question.slice(0, ++i);
      if (i < question.length) setTimeout(step, 38 + Math.random() * 35);
      else done?.();
    };
    step();
  };
  const erase = done => {
    const step = () => {
      text.textContent = text.textContent.slice(0, -2);
      if (text.textContent.length > 0) setTimeout(step, 14);
      else done?.();
    };
    step();
  };

  function typeQuestions() {
    text.textContent = '';
    line.classList.remove('is-placeholder');
    const next = index => {
      type(pickQuestion(examples[index]), () => {
        if (index === examples.length - 1) {
          setTimeout(() => line.classList.add('caret-off'), 3000);
          return;
        }
        setTimeout(() => erase(() => setTimeout(() => next(index + 1), 350)), 1900);
      });
    };
    next(0);
  }

  function play() {
    const cardWidth = card.clientWidth;
    const w = pill.offsetWidth, h = pill.offsetHeight;
    const cx = pill.offsetLeft + w / 2;
    const restCenter = pill.offsetTop + h / 2;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'siri-neck');
    svg.setAttribute('width', cardWidth);
    svg.setAttribute('height', restCenter + h);
    svg.setAttribute('aria-hidden', 'true');
    // The neck fades from the card's own surface color into black, so it reads as the card
    // surface being pulled down into the pill instead of a black shape stuck on a gray edge.
    const parse = value => (value.match(/[\d.]+/g) || [0, 0, 0, 1]).map(Number);
    const over = (top, under) => { const alpha = top[3] ?? 1; return [0, 1, 2].map(i => Math.round(top[i] * alpha + under[i] * (1 - alpha))); };
    const base = over(parse(getComputedStyle(card).backgroundColor), parse(getComputedStyle(document.body).backgroundColor));
    const mix = f => `rgb(${base.map(v => Math.round(v * (1 - f))).join(',')})`;
    const defs = document.createElementNS(NS, 'defs');
    const gradients = ['neck', 'bump'].map(name => {
      const g = document.createElementNS(NS, 'linearGradient');
      g.setAttribute('id', `siri-${name}-fade`);
      g.setAttribute('gradientUnits', 'userSpaceOnUse');
      g.setAttribute('x1', 0);
      g.setAttribute('x2', 0);
      g.setAttribute('y1', 0);
      [[0, mix(0)], [0.5, mix(0.55)], [1, mix(1)]].forEach(([offset, color]) => {
        const stop = document.createElementNS(NS, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', color);
        g.append(stop);
      });
      defs.append(g);
      return g;
    });
    const neck = document.createElementNS(NS, 'path');
    const bump = document.createElementNS(NS, 'path');
    neck.setAttribute('fill', 'url(#siri-neck-fade)');
    bump.setAttribute('fill', 'url(#siri-bump-fade)');
    svg.append(defs, neck, bump);
    card.insertBefore(svg, pill);
    card.classList.add('siri-animating');
    pill.style.opacity = '1';
    text.textContent = 'Search or Ask';
    line.classList.add('is-placeholder', 'is-typing');
    line.style.opacity = mic.style.opacity = '0';
    const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function render(p) {
      const q = clamp(p / 0.5);
      const spring = 1 - Math.exp(-5.5 * p) * Math.cos(9 * p); // overshoots, then settles
      const startCenter = -h * 0.5;
      const center = startCenter + (restCenter - startCenter) * spring;
      const sx = 0.55 + 0.45 * easeOut(clamp(p / 0.6));
      const sy = 1 + 0.3 * Math.sin(Math.PI * clamp(p / 0.5)); // stretches into a drop while falling
      pill.style.transform = `translateY(${center - restCenter}px) scale(${sx}, ${sy})`;
      line.style.opacity = mic.style.opacity = String(clamp((p - 0.3) / 0.3));
      const top = center - (h * sy) / 2;
      const half = (w * sx) / 2;
      if (p < 0.5) {
        const w1 = 38 - 12 * q, w2 = Math.min(half * 0.4, 52), w0 = 24 * Math.pow(1 - q, 1.4);
        const yb = top + h * sy * 0.3;
        gradients[0].setAttribute('y2', Math.max(yb, 1));
        neck.setAttribute('d', yb > 1
          ? `M${cx - w1} -4L${cx - w1} 0Q${cx - w0} ${yb / 2} ${cx - w2} ${yb}L${cx + w2} ${yb}Q${cx + w0} ${yb / 2} ${cx + w1} 0L${cx + w1} -4Z`
          : '');
        bump.setAttribute('d', '');
      } else {
        neck.setAttribute('d', '');
        const r = clamp((p - 0.5) / 0.3);
        const bw = 28 * (1 - r), depth = 12 * (1 - r) * (1 - r);
        gradients[1].setAttribute('y2', Math.max(depth, 1));
        bump.setAttribute('d', r < 1
          ? `M${cx - bw} -2L${cx - bw} 0C${cx - bw * 0.4} 0 ${cx - bw * 0.5} ${depth} ${cx} ${depth}S${cx + bw * 0.4} 0 ${cx + bw} 0L${cx + bw} -2Z`
          : '');
      }
    }

    const start = performance.now();
    render(0);
    const frame = now => {
      const p = clamp((now - start) / DURATION);
      if (p < 1) {
        render(p);
        requestAnimationFrame(frame);
        return;
      }
      pill.style.transform = '';
      line.style.opacity = mic.style.opacity = '';
      pill.classList.remove('is-pending');
      svg.remove();
      card.classList.remove('siri-animating');
      setTimeout(typeQuestions, 900);
    };
    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    play();
  }, { threshold: 0.6 });
  observer.observe(card);
})();

// Hoardini chat demo: question, typing dots, answer, then a follow-up. Plays once when the card scrolls into view.
(() => {
  const chat = document.querySelector('.chat-example');
  if (!chat || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bubbles = [...chat.children];
  const widths = new Map();
  bubbles.forEach(bubble => {
    if (!bubble.classList.contains('bubble-ai')) return;
    const message = document.createElement('b');
    message.className = 'txt';
    message.textContent = bubble.textContent;
    const dots = document.createElement('i');
    dots.className = 'dots';
    dots.innerHTML = '<i></i><i></i><i></i>';
    bubble.textContent = '';
    bubble.append(message, dots);
  });
  // Measure each answer at its natural width before anything is hidden, so the layout never jumps.
  bubbles.forEach(bubble => { if (bubble.classList.contains('bubble-ai')) widths.set(bubble, bubble.getBoundingClientRect().width); });
  bubbles.forEach(bubble => bubble.classList.add('is-hidden'));

  const show = bubble => {
    bubble.classList.add('is-shown');
    bubble.classList.remove('is-hidden');
  };
  const answer = bubble => {
    bubble.style.width = `${widths.get(bubble)}px`;
    bubble.classList.add('is-growing');
    bubble.classList.remove('is-thinking');
    setTimeout(() => {
      bubble.classList.remove('is-growing');
      bubble.style.width = '';
    }, 650);
  };
  const think = bubble => {
    bubble.classList.add('is-thinking');
    show(bubble);
  };
  const [q1, a1, q2, a2] = bubbles;
  const steps = [
    [350, () => show(q1)],
    [1150, () => think(a1)],
    [2500, () => answer(a1)],
    [4300, () => show(q2)],
    [5100, () => think(a2)],
    [6400, () => answer(a2)]
  ];
  const play = () => steps.forEach(([delay, run]) => setTimeout(run, delay));

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    play();
  }, { threshold: 0.7 });
  observer.observe(chat);
})();

// Coverage demo: the generations fill in one by one, once, when the card is scrolled into view.
(() => {
  const grid = document.querySelector('.coverage');
  if (!grid || !('IntersectionObserver' in window)) return;
  grid.classList.add('is-pending');
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    grid.classList.add('is-in');
    observer.disconnect();
  }, { threshold: 0.8 });
  observer.observe(grid);
})();

// Firmware card: the installed version ticks through a few releases and lands on the real one. Plays once on scroll.
(() => {
  const card = document.querySelector('.firmware-example');
  const ver = card?.querySelector('.fw-ver');
  const build = card?.querySelector('.fw-build');
  if (!card || !ver || !build || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const final = [ver.textContent, build.textContent];
  const releases = [['iOS 15.0', '19A346'], ['iOS 17.0', '21A329'], ['iOS 18.0', '22A3354'], ['iOS 26.0', '23A340'], final];
  ver.textContent = '';
  build.textContent = '';
  const show = ([name, code]) => {
    ver.textContent = name;
    build.textContent = code;
    [ver, build].forEach(node => { node.classList.remove('is-tick'); void node.offsetWidth; node.classList.add('is-tick'); });
  };
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    releases.forEach((release, index) => setTimeout(() => {
      show(release);
      if (index === releases.length - 1) {
        card.classList.add('is-settling');
        setTimeout(() => { [ver, build].forEach(node => node.classList.remove('is-tick')); }, 500);
      }
    }, 300 + index * 620));
  }, { threshold: 0.7 });
  observer.observe(card);
})();

// Sync card: a pass travels Mac -> iCloud -> iPhone, lighting each device in turn. Plays once on scroll.
(() => {
  const motif = document.querySelector('.sync-motif');
  if (!motif || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const chips = [...motif.querySelectorAll('span')];
  const arrows = [...motif.querySelectorAll('i')];
  motif.classList.add('is-pending');
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    const light = index => {
      chips.forEach((chip, i) => { chip.classList.toggle('is-lit', i === index); if (i < index) chip.classList.add('is-done'); });
    };
    const at = (delay, run) => setTimeout(run, delay);
    at(300, () => light(0));
    at(900, () => arrows[0].classList.add('is-flowing'));
    at(1500, () => light(1));
    at(2100, () => arrows[1].classList.add('is-flowing'));
    at(2700, () => light(2));
    at(3700, () => {
      chips.forEach(chip => chip.classList.remove('is-lit'));
      motif.classList.remove('is-pending');
    });
  }, { threshold: 0.9 });
  observer.observe(motif);
})();
