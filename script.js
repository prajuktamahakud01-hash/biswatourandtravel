// ─── DARK MODE TOGGLE ───
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.body.classList.add('dark');
}
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// ─── NAVBAR SCROLL ───
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ─── MOBILE MENU ───
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navAnchors = document.querySelectorAll('.nav-links a');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
});

navAnchors.forEach(a => a.addEventListener('click', () => {
  hamburger.classList.remove('active');
  navLinks.classList.remove('active');
  document.body.style.overflow = '';
}));

// ─── SET MINIMUM DATE FOR BOOKING (Today + Future Only) ───
const dateInput = document.getElementById('date');
if (dateInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;
  dateInput.setAttribute('min', minDate);
}

// ─── GOOGLE MAPS PRICE CALCULATOR ───
let pickupAutocomplete, destAutocomplete;
let pickupPlace = null, destPlace = null;

const calcLoading = document.getElementById('calc-loading');
const calcError = document.getElementById('calc-error');
const calcErrorMsg = document.getElementById('calc-error-msg');
const calcResults = document.getElementById('calc-results');
const calcDistValue = document.getElementById('calc-dist-value');
const calcDuration = document.getElementById('calc-duration');
const priceDzire = document.getElementById('price-dzire');
const priceErtiga = document.getElementById('price-ertiga');

function initGoogleMaps() {
  const pickupInput = document.getElementById('calc-pickup');
  const destInput = document.getElementById('calc-destination');
  if (!pickupInput || !destInput) { console.warn('Calculator inputs not found'); return; }

  const options = { componentRestrictions: { country: 'in' } };

  pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
  destAutocomplete = new google.maps.places.Autocomplete(destInput, options);

  pickupAutocomplete.addListener('place_changed', () => {
    pickupPlace = pickupAutocomplete.getPlace();
    if (pickupPlace && destPlace) fetchDistance();
  });
  destAutocomplete.addListener('place_changed', () => {
    destPlace = destAutocomplete.getPlace();
    if (pickupPlace && destPlace) fetchDistance();
  });
}

// Expose to global for Google Maps callback
window.initGoogleMaps = initGoogleMaps;

function showCalcState(state) {
  calcLoading.classList.toggle('show', state === 'loading');
  calcError.classList.toggle('show', state === 'error');
  calcResults.classList.toggle('show', state === 'results');
}

async function fetchDistance() {
  showCalcState('loading');
  const service = new google.maps.DistanceMatrixService();

  try {
    const origin = pickupPlace.geometry ? pickupPlace.geometry.location : pickupPlace.name;
    const destination = destPlace.geometry ? destPlace.geometry.location : destPlace.name;

    service.getDistanceMatrix(
      { origins: [origin], destinations: [destination], travelMode: 'DRIVING', unitSystem: google.maps.UnitSystem.METRIC },
      (response, status) => {
        if (status !== 'OK') { showError('Could not connect to Google Maps. Please try again.'); return; }
        const result = response.rows[0].elements[0];
        if (result.status !== 'OK') { showError('No route found between these locations.'); return; }

        const distKm = Math.round(result.distance.value / 1000);
        const durationText = result.duration.text;
        const dzireTotal = distKm * 14;
        const ertigaTotal = distKm * 18;

        calcDistValue.textContent = distKm.toLocaleString('en-IN') + ' KM';
        calcDuration.textContent = '~' + durationText;
        priceDzire.textContent = '₹' + dzireTotal.toLocaleString('en-IN');
        priceErtiga.textContent = '₹' + ertigaTotal.toLocaleString('en-IN');
        showCalcState('results');
      }
    );
  } catch (err) {
    showError('Something went wrong. Please check your locations.');
  }
}

function showError(msg) {
  calcErrorMsg.textContent = msg;
  showCalcState('error');
}

// ─── BOOKING FORM → WhatsApp Redirect ───
const bookingForm = document.getElementById('booking-form');
const formSuccess = document.getElementById('form-success');

function isValidEmail(email) {
  return /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email);
}

function isValidPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

bookingForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const travelers = document.getElementById('travelers').value.trim();
  const place = document.getElementById('place').value;
  const date = document.getElementById('date').value;
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !phone || !travelers || !place || !date) {
    alert('Please fill in all required fields.');
    return;
  }
  if (!isValidEmail(email)) {
    alert('Please enter a valid email address.');
    return;
  }
  if (!isValidPhone(phone)) {
    alert('Please enter a valid phone number (10-15 digits).');
    return;
  }

  // Build WhatsApp message with booking details
  const whatsappNumber = '919348354248';
  const waMessage =
    `*🚗 New Booking Request - Biswa's Tour and Travels*\n\n` +
    `*Name:* ${name}\n` +
    `*Phone:* ${phone}\n` +
    `*Email:* ${email}\n` +
    `*Travelers:* ${travelers}\n` +
    `*Place/Package:* ${place}\n` +
    `*Travel Date:* ${date}\n` +
    (message ? `*Message:* ${message}\n` : '') +
    `\nPlease confirm my booking. Thank you!`;

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;

  // Show success message and redirect to WhatsApp
  bookingForm.style.display = 'none';
  formSuccess.style.display = 'block';

  // Open WhatsApp in new tab
  window.open(waUrl, '_blank');

  // Reset form for next use
  bookingForm.reset();
});

// ─── SCROLL REVEAL ───
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealElements.forEach(el => revealObserver.observe(el));

// ─── COUNTER ANIMATION ───
function animateCounters() {
  document.querySelectorAll('.counter').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      counter.textContent = Math.floor(current).toLocaleString('en-IN') + suffix;
    }, 16);
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) { animateCounters(); heroObserver.disconnect(); }
}, { threshold: 0.3 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// ─── PLACES DATA & LOGIC ───
const placesData = [
  {
    id: 1,
    name: "Puri",
    category: "temple beach",
    img: "images/puri img.png",
    desc: "Home to the sacred Jagannath Temple and beautiful Golden Beach.",
    fullDesc: "Puri is one of the Char Dham pilgrimage sites for Hindus and is famous for the Jagannath Temple and its annual Rath Yatra. The city also features the stunning Golden Beach, perfect for a relaxing evening.",
    rating: 4.8,
    bestTime: "October to March",
    attractions: "Jagannath Temple, Golden Beach, Raghurajpur",
    cost: "₹3,000 - ₹5,000 / day",
    facilities: ["Hotels & Resorts", "Local Transport", "Restaurants", "Guides"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119743.53374932646!2d85.7513!3d19.8133!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19c4180256e495%3A0x496a9d8bf31ce8b3!2sPuri%2C%20Odisha!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 2,
    name: "Konark Sun Temple",
    category: "temple",
    img: "images/konarak.jpg",
    desc: "A 13th-century architectural marvel shaped like a giant chariot.",
    fullDesc: "The Konark Sun Temple is a UNESCO World Heritage site known for its intricate stone carvings and monumental architecture. It is designed in the shape of a colossal chariot carrying the sun god Surya.",
    rating: 4.9,
    bestTime: "September to March",
    attractions: "Sun Temple, Chandrabhaga Beach, ASI Museum",
    cost: "₹2,000 - ₹3,500 / day",
    facilities: ["Parking", "Tour Guides", "Restaurants", "Souvenir Shops"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3744.133203498877!2d86.09214731491873!3d19.88759698662991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19f2a0937a0925%3A0xc6651da01dfd186c!2sKonark%20Sun%20Temple!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 3,
    name: "Chilika Lake",
    category: "nature wildlife",
    img: "images/chilika.png",
    desc: "Asia's largest brackish water lagoon, famous for migratory birds and dolphins.",
    fullDesc: "Chilika Lake is a paradise for nature lovers and bird watchers. It hosts millions of migratory birds during winter and is one of the few places in India where you can spot Irrawaddy dolphins.",
    rating: 4.7,
    bestTime: "November to February",
    attractions: "Satapada, Mangalajodi, Kalijai Temple",
    cost: "₹2,500 - ₹4,000 / day",
    facilities: ["Boat Rides", "Eco-Resorts", "Seafood", "Parking"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d240212.00030580975!2d85.1581!3d19.7214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1820b73c9f225d%3A0xa6f6e522b3e8c9b9!2sChilika%20Lake!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 4,
    name: "Bhubaneswar",
    category: "temple",
    img: "images/ISBT_Baramunda_Bhubaneswar.jpg",
    desc: "The Temple City of India, blending ancient heritage with modern urban life.",
    fullDesc: "Bhubaneswar, the capital of Odisha, is known as the 'Temple City' due to its hundreds of ancient temples. It perfectly bridges the gap between historical monuments and a rapidly developing smart city.",
    rating: 4.6,
    bestTime: "October to March",
    attractions: "Lingaraj Temple, Udayagiri Caves, Nandankanan",
    cost: "₹2,500 - ₹5,000 / day",
    facilities: ["Luxury Hotels", "Malls", "Cab Services", "Restaurants"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119743.53374932646!2d85.7513!3d20.2961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1909d2d5170aa5%3A0xfc580e2b68b33fa8!2sBhubaneswar%2C%20Odisha!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 5,
    name: "Daringbadi",
    category: "hill nature",
    img: "images/Daringbadi-7-scaled.jpg",
    desc: "Known as the 'Kashmir of Odisha', famous for pine forests and waterfalls.",
    fullDesc: "Daringbadi is a beautiful hill station situated in the Kandhamal district. With its pine jungles, coffee gardens, and beautiful valleys, it is the only place in Odisha that experiences snowfall-like frost in winter.",
    rating: 4.7,
    bestTime: "September to May",
    attractions: "Hill View Park, Mandasaru, Midubanda Waterfall",
    cost: "₹3,000 - ₹6,000 / day",
    facilities: ["Eco-Camps", "Resorts", "Local Transport", "Trekking"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d84.1167!3d19.9167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a22c5443c166cb3%3A0x6e8f47c3cfd15024!2sDaringbadi%2C%20Odisha!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 6,
    name: "Simlipal National Park",
    category: "wildlife nature",
    img: "images/shimilpala.png",
    desc: "A tiger reserve and national park with lush greenery and waterfalls.",
    fullDesc: "Simlipal is a sprawling tiger reserve, sanctuary, and national park in the Mayurbhanj district. It is home to Bengal tigers, Asian elephants, and features spectacular waterfalls like Barehipani and Joranda.",
    rating: 4.8,
    bestTime: "November to mid-June",
    attractions: "Barehipani Waterfall, Joranda Waterfall, Tiger Safari",
    cost: "₹4,000 - ₹7,000 / day",
    facilities: ["Forest Lodges", "Safari Jeeps", "Guides", "Camping"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118944.5!2d86.3!3d21.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1c8f1e!2sSimlipal%20National%20Park!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 7,
    name: "Deomali",
    category: "hill nature",
    img: "images/deomali.png",
    desc: "The highest mountain peak of Odisha, offering breathtaking scenic views.",
    fullDesc: "Deomali, located in the Koraput district, is the highest peak in Odisha. It is a stunning destination for nature lovers, trekkers, and photographers offering panoramic views of the Eastern Ghats.",
    rating: 4.6,
    bestTime: "October to March",
    attractions: "Mountain Peak, Koraput Valley, Duduma Waterfall",
    cost: "₹2,500 - ₹4,500 / day",
    facilities: ["Trekking", "Camping", "Homestays", "Photography"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d82.9833!3d18.6667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3b5c!2sDeomali%2C%20Odisha!5e0!3m2!1sen!2sin!4v1713528400000"
  },
  {
    id: 8,
    name: "Hirakud Dam",
    category: "nature",
    img: "images/hirakud.png",
    desc: "One of the longest earthen dams in the world built across the Mahanadi river.",
    fullDesc: "Hirakud Dam is an engineering marvel and a beautiful tourist spot in Sambalpur. The reservoir is vast and hosts migratory birds in winter. The Gandhi Minar provides a fantastic aerial view of the dam.",
    rating: 4.5,
    bestTime: "September to March",
    attractions: "Gandhi Minar, Nehru Minar, Debrigarh Wildlife",
    cost: "₹2,000 - ₹3,500 / day",
    facilities: ["Viewpoints", "Boating", "Restaurants", "Parking"],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d83.8744!3d21.5273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a2135!2sHirakud%20Dam%2C%20Odisha!5e0!3m2!1sen!2sin!4v1713528400000"
  }
];

const placesGrid = document.getElementById('places-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const placeSearch = document.getElementById('place-search');

function renderPlaces(places) {
  if (!placesGrid) return;
  placesGrid.innerHTML = '';
  places.forEach(place => {
    const card = document.createElement('div');
    card.className = `place-card reveal visible`;
    card.setAttribute('data-category', place.category);
    
    card.innerHTML = `
      <div class="place-img-wrap">
        <img src="${place.img}" alt="${place.name}" loading="lazy">
        <div class="place-rating"><i class="fa-solid fa-star"></i> ${place.rating}</div>
      </div>
      <div class="place-info">
        <h3>${place.name}</h3>
        <p>${place.desc}</p>
        <button class="place-btn" onclick="openPlaceModal(${place.id})">View Details</button>
      </div>
    `;
    placesGrid.appendChild(card);
  });
}

if (placesGrid) {
  renderPlaces(placesData);
}

if (filterBtns) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filter = btn.getAttribute('data-filter');
      const searchTerm = placeSearch ? placeSearch.value.toLowerCase() : '';
      
      const filteredPlaces = placesData.filter(place => {
        const matchesFilter = filter === 'all' || place.category.includes(filter);
        const matchesSearch = place.name.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
      });
      
      renderPlaces(filteredPlaces);
    });
  });
}

if (placeSearch) {
  placeSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
    
    const filteredPlaces = placesData.filter(place => {
      const matchesFilter = activeFilter === 'all' || place.category.includes(activeFilter);
      const matchesSearch = place.name.toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
    
    renderPlaces(filteredPlaces);
  });
}

const placeModal = document.getElementById('place-modal');
const modalClose = document.getElementById('modal-close');
const modalBody = document.getElementById('modal-body');

window.openPlaceModal = function(id) {
  const place = placesData.find(p => p.id === id);
  if (!place) return;
  
  const facilitiesHtml = place.facilities.map(f => `<li><i class="fa-solid fa-check-circle"></i> ${f}</li>`).join('');
  
  modalBody.innerHTML = `
    <div class="modal-hero">
      <img src="${place.img}" alt="${place.name}">
      <div class="modal-hero-content">
        <div class="modal-rating"><i class="fa-solid fa-star"></i> ${place.rating}</div>
        <h2>${place.name}</h2>
      </div>
    </div>
    <div class="modal-details">
      <div class="modal-main-info">
        <p>${place.fullDesc}</p>
        <div class="modal-meta">
          <div class="modal-meta-item">
            <span>Best Time</span>
            <span><i class="fa-regular fa-calendar"></i> ${place.bestTime}</span>
          </div>
          <div class="modal-meta-item">
            <span>Travel Cost</span>
            <span><i class="fa-solid fa-wallet"></i> ${place.cost}</span>
          </div>
          <div class="modal-meta-item">
            <span>Nearby Attractions</span>
            <span><i class="fa-solid fa-location-dot"></i> ${place.attractions}</span>
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="selectPackage('${place.name}')">Book Now</button>
      </div>
      
      <div class="modal-sidebar">
        <h3>Facilities</h3>
        <ul class="modal-facilities">
          ${facilitiesHtml}
        </ul>
        <div class="modal-map">
          <iframe src="${place.mapUrl}" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    </div>
  `;
  
  placeModal.classList.add('show');
  document.body.style.overflow = 'hidden';
};

if (modalClose) {
  modalClose.addEventListener('click', () => {
    placeModal.classList.remove('show');
    document.body.style.overflow = '';
  });
}

if (placeModal) {
  placeModal.addEventListener('click', (e) => {
    if (e.target === placeModal) {
      placeModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
}

window.selectPackage = function(packageName) {
  if (placeModal) {
    placeModal.classList.remove('show');
    document.body.style.overflow = '';
  }
  
  const placeSelect = document.getElementById('place');
  if (placeSelect) {
    let optionExists = false;
    for (let i = 0; i < placeSelect.options.length; i++) {
      if (placeSelect.options[i].value === packageName) {
        placeSelect.selectedIndex = i;
        optionExists = true;
        break;
      }
    }
    
    if (!optionExists) {
      placeSelect.value = 'Custom';
      document.getElementById('message').value = `I am interested in booking: ${packageName}`;
    }
  }
  
  const bookingSection = document.getElementById('booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth' });
  }
};
