let currentIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.style.transform = `translateX(${-index * 100}%)`;
        dots[i].classList.toggle('active', i === index);
    });
}

function nextSlide() {
    currentIndex = (currentIndex < slides.length - 1) ? currentIndex + 1 : 0;
    showSlide(currentIndex);
}

setInterval(nextSlide, 4000);

// Initial call to display the first slide
showSlide(currentIndex);
