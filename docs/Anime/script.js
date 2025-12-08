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

let currentIndex = 0;

function createCard(anime, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;

    if (anime.image) {
        const img = document.createElement('img');
        img.src = anime.image;
        img.alt = anime.title;
        img.draggable = false;
        card.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'card-placeholder';
        const text = document.createElement('div');
        text.className = 'card-placeholder-text';
        text.textContent = anime.title;
        placeholder.appendChild(text);
        card.appendChild(placeholder);
    }

    card.addEventListener('click', () => {
        updateCarousel(index);
    });

    return card;
}

function createDot(index) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.addEventListener('click', () => {
        updateCarousel(index);
    });
    return dot;
}

function init() {
    // Create cards
    animeList.forEach((anime, index) => {
        const card = createCard(anime, index);
        carousel.appendChild(card);

        const dot = createDot(index);
        pagination.appendChild(dot);
    });

    updateCarousel(0);
}

function updateCarousel(newIndex) {
    currentIndex = newIndex;
    const cards = document.querySelectorAll('.card');
    const dots = document.querySelectorAll('.dot');

    // Update Cards
    cards.forEach((card, index) => {
        // Reset classes
        card.className = 'card';

        const diff = index - currentIndex;

        if (diff === 0) {
            card.classList.add('active');
        } else if (diff === -1) {
            card.classList.add('prev-1');
        } else if (diff === 1) {
            card.classList.add('next-1');
        } else if (diff === -2) {
            card.classList.add('prev-2');
        } else if (diff === 2) {
            card.classList.add('next-2');
        } else {
            // Handle looping somewhat or just hide distinct
            // For simple 3D list, just hide others or pile them
            // Let's make them hidden if too far
            card.classList.add('hidden');
        }
    });

    // Update Dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });

    // Update Info with animation
    infoPanel.style.opacity = 0;
    setTimeout(() => {
        titleEl.textContent = animeList[currentIndex].title;
        yearEl.textContent = animeList[currentIndex].year;
        infoPanel.style.opacity = 1;
    }, 200);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        if (currentIndex < animeList.length - 1) updateCarousel(currentIndex + 1);
    } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) updateCarousel(currentIndex - 1);
    }
});

// Drag / Swipe functionality
let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID;
const container = document.querySelector('.carousel-container');

container.addEventListener('mousedown', touchStart);
container.addEventListener('touchstart', touchStart);

container.addEventListener('mouseup', touchEnd);
container.addEventListener('mouseleave', touchEnd);
container.addEventListener('touchend', touchEnd);

container.addEventListener('mousemove', touchMove);
container.addEventListener('touchmove', touchMove);

function touchStart(event) {
    if (event.type.includes('mouse')) {
        event.preventDefault();
    }

    isDragging = true;
    startPos = getPositionX(event);
    animationID = requestAnimationFrame(animation);
    container.style.cursor = 'grabbing';
}

function touchEnd() {
    isDragging = false;
    cancelAnimationFrame(animationID);
    container.style.cursor = 'grab';

    const movedBy = currentTranslate - prevTranslate;

    // Threshold to change slide
    if (movedBy < -50) {
        if (currentIndex < animeList.length - 1) updateCarousel(currentIndex + 1);
    } else if (movedBy > 50) {
        if (currentIndex > 0) updateCarousel(currentIndex - 1);
    }

    // Reset
    currentTranslate = 0;
    prevTranslate = 0;
}

function touchMove(event) {
    if (isDragging) {
        const currentPosition = getPositionX(event);
        currentTranslate = prevTranslate + currentPosition - startPos;
    }
}

function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function animation() {
    if (isDragging) requestAnimationFrame(animation);
}

// Initial cursor
container.style.cursor = 'grab';

init();
