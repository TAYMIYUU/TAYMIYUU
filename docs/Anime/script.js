const animeList = [
    { title: "Attack on Titan", year: "2016-2023", image: "assets/aot.png" },
    { title: "Frieren: Beyond Journey's End", year: "2023-2024", image: "assets/frieren.png" },
    { title: "Mob Psycho 100", year: "2016-2022", image: "assets/mob.png" },
    { title: "Jujutsu Kaisen", year: "2020-2023", image: "assets/jjk.png" },
    { title: "Vinland Saga", year: "2019-2023", image: "assets/vinland.png" },
    { title: "Demon Slayer", year: "2019-2025", image: "assets/demonslayer.png" },
    { title: "Kaguya-sama: Love Is War", year: "2019-2022", image: "assets/kaguya.png" },
    { title: "Spy x Family", year: "2022-2025", image: "assets/spyxfamily.jpg" },
    { title: "My Hero Academia", year: "2016-2025", image: "assets/mha.jpg" },
    { title: "Odd Taxi", year: "2021", image: "assets/odd_taxi.png" }
];

const carousel = document.getElementById('carousel');
const pagination = document.getElementById('pagination');
const titleEl = document.getElementById('anime-title');
const yearEl = document.getElementById('anime-year');
const infoPanel = document.querySelector('.info-panel');

// State for continuous interaction
const state = {
    // currentProgress: represents the floating point index of the center of view
    // 0 = first item centered, 1 = second item centered, etc.
    currentProgress: 0,
    targetProgress: 0, // Where we want to snap to
    isDragging: false,
    startX: 0,
    startProgress: 0
};

// Checkpoints for interpolation: [relative_index, transform_values]
// diff = cardIndex - currentProgress
// e.g. if we are at progress 0, card 0 has diff 0.
const checkpoints = [
    { diff: -2, x: -280, scale: 0.7, z: -100, rot: 25, opacity: 0.4 },
    { diff: -1, x: -160, scale: 0.9, z: 0, rot: 15, opacity: 0.7 },
    { diff: 0, x: 0, scale: 1.2, z: 100, rot: 0, opacity: 1 },
    { diff: 1, x: 160, scale: 0.9, z: 0, rot: -15, opacity: 0.7 },
    { diff: 2, x: 280, scale: 0.7, z: -100, rot: -25, opacity: 0.4 }
];

function init() {
    // Create cards
    animeList.forEach((anime, index) => {
        const card = createCard(anime, index);
        carousel.appendChild(card);
        const dot = createDot(index);
        pagination.appendChild(dot);
    });

    // Start loop
    requestAnimationFrame(animateLoop);
}

function createCard(anime, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;

    const content = anime.image ?
        `<img src="${anime.image}" alt="${anime.title}" draggable="false">` :
        `<div class="card-placeholder"><div class="card-placeholder-text">${anime.title}</div></div>`;

    card.innerHTML = content;

    // Click to jump if not dragging
    card.addEventListener('click', (e) => {
        if (!state.isDragging && Math.abs(state.currentProgress - index) > 0.1) {
            state.targetProgress = index;
        }
    });

    return card;
}

function createDot(index) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.addEventListener('click', () => {
        state.targetProgress = index;
    });
    return dot;
}

function updateVisuals(progress) {
    const cards = document.querySelectorAll('.card');

    // Check bounds for looping or clamping
    // Here we clamp visual progress for text, but cards can be calculated freely if we wanted wrapping.
    // For now, simpler clamping behavior matches previous logic.

    cards.forEach((card, index) => {
        const diff = index - progress;

        // Optimization: don't render if far off screen
        if (Math.abs(diff) > 3) {
            card.style.display = 'none';
            return;
        }

        card.style.display = 'flex';
        const style = getInterpolatedStyle(diff);

        card.style.zIndex = Math.round(100 - Math.abs(diff) * 10);
        card.style.transform = `translateX(${style.x}%) scale(${style.scale}) translateZ(${style.z}px) rotateY(${style.rot}deg)`;
        card.style.opacity = style.opacity;

        // Active styling
        if (Math.abs(diff) < 0.3) {
            card.style.borderColor = 'var(--secondary)';
            card.style.boxShadow = '0 20px 50px rgba(108, 92, 231, 0.4)';
            card.classList.add('active');
        } else {
            card.style.borderColor = 'rgba(255,255,255,0.1)';
            card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
            card.classList.remove('active');
        }
    });

    const activeIndex = Math.round(Math.max(0, Math.min(animeList.length - 1, progress)));
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIndex);
    });
}

function getInterpolatedStyle(diff) {
    // We strictly use the checkpoints [-2, -1, 0, 1, 2]
    // If diff is outside, clamp to nearest edge
    if (diff <= -2) return checkpoints[0];
    if (diff >= 2) return checkpoints[checkpoints.length - 1];

    // Find the segment diff belongs to
    // Since our checkpoints are sorted by diff: -2, -1, 0, 1, 2
    // We can just iterate.
    let p1 = checkpoints[0];
    let p2 = checkpoints[checkpoints.length - 1];

    for (let i = 0; i < checkpoints.length - 1; i++) {
        if (diff >= checkpoints[i].diff && diff <= checkpoints[i + 1].diff) {
            p1 = checkpoints[i];
            p2 = checkpoints[i + 1];
            break;
        }
    }

    const range = p2.diff - p1.diff;
    const t = (diff - p1.diff) / range; // 0..1

    return {
        x: lerp(p1.x, p2.x, t),
        scale: lerp(p1.scale, p2.scale, t),
        z: lerp(p1.z, p2.z, t),
        rot: lerp(p1.rot, p2.rot, t),
        opacity: lerp(p1.opacity, p2.opacity, t)
    };
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

function updateText(progress) {
    const index = Math.round(Math.max(0, Math.min(animeList.length - 1, progress)));
    const anime = animeList[index];

    if (titleEl.textContent !== anime.title) {
        // Simple swap without flicker
        titleEl.textContent = anime.title;
        yearEl.textContent = anime.year;

        // Retrigger fade
        infoPanel.style.animation = 'none';
        infoPanel.offsetHeight; /* trigger reflow */
        infoPanel.style.animation = 'fadeIn 0.5s forwards';
    }
}

function animateLoop() {
    // If not dragging, snap to target
    if (!state.isDragging) {
        // Smooth dampening
        state.currentProgress += (state.targetProgress - state.currentProgress) * 0.1;

        // Snap complete
        if (Math.abs(state.targetProgress - state.currentProgress) < 0.001) {
            state.currentProgress = state.targetProgress;
        }
    }

    updateVisuals(state.currentProgress);
    updateText(state.currentProgress);

    requestAnimationFrame(animateLoop);
}

// Interactions
const container = document.querySelector('.carousel-container');

container.addEventListener('mousedown', dragStart);
container.addEventListener('touchstart', dragStart);

window.addEventListener('mouseup', dragEnd);
window.addEventListener('touchend', dragEnd);

window.addEventListener('mousemove', dragMove);
window.addEventListener('touchmove', dragMove);

function getX(e) {
    return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
}

function dragStart(e) {
    if (e.type.includes('mouse')) e.preventDefault();
    state.isDragging = true;
    state.startX = getX(e);
    state.startProgress = state.currentProgress;
    container.style.cursor = 'grabbing';
}

function dragMove(e) {
    if (!state.isDragging) return;

    const x = getX(e);
    const delta = x - state.startX;

    // Sensitivity: how many pixels = 1 card width movement?
    // Move mouse Left (negative delta) -> Should increment Progress (camera moves right)
    const sensitivity = 300;

    // delta < 0 (left) => active index increases (next item)
    state.currentProgress = state.startProgress - (delta / sensitivity);

    // Elastic bounds
    const min = -0.5;
    const max = animeList.length - 0.5;

    if (state.currentProgress < min) {
        state.currentProgress = min + (state.currentProgress - min) * 0.2;
    } else if (state.currentProgress > max) {
        state.currentProgress = max + (state.currentProgress - max) * 0.2;
    }
}

function dragEnd() {
    if (!state.isDragging) return;
    state.isDragging = false;
    container.style.cursor = 'grab';

    // Set snap target
    state.targetProgress = Math.round(state.currentProgress);

    // Clamp target
    state.targetProgress = Math.max(0, Math.min(animeList.length - 1, state.targetProgress));
}

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        state.targetProgress = Math.min(animeList.length - 1, Math.round(state.targetProgress) + 1);
    } else if (e.key === 'ArrowLeft') {
        state.targetProgress = Math.max(0, Math.round(state.targetProgress) - 1);
    }
});

init();
