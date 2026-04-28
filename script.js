/* --- UTILITÁRIO: GERA SLUG DO JOGO PARA info.html --- */
function toGameSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ============================================================
   UTILITÁRIO: DETECTA SE É YOUTUBE ID OU URL CLOUDINARY
   ============================================================ */
function isYouTubeId(src) {
  if (!src) return false;
  if (src.includes('cloudinary') || src.includes('http') || src.includes('//')) return false;
  return /^[a-zA-Z0-9_-]{6,15}$/.test(src.trim());
}

function getYouTubeId(src) {
  if (!src) return null;
  if (src.includes('youtube.com/embed/')) return src.split('youtube.com/embed/')[1].split('?')[0];
  if (src.includes('youtube.com/watch?v=')) return src.split('v=')[1].split('&')[0];
  if (src.includes('youtu.be/')) return src.split('youtu.be/')[1].split('?')[0];
  if (isYouTubeId(src)) return src.trim();
  return null;
}

/* ============================================================
   BANNER: TROCA VÍDEO (Cloudinary ou YouTube)
   ============================================================ */
function setBannerVideo(videoSrc) {
  const ytId = getYouTubeId(videoSrc);
  const section = document.getElementById('main-banner');
  if (!section) return;

  const existing = document.getElementById('banner-video');

  if (ytId) {
    // Remove elemento anterior e qualquer overlay
    if (existing) {
      const nextEl = existing.nextElementSibling;
      if (nextEl && nextEl.dataset && nextEl.dataset.bannerOverlay) nextEl.remove();
      existing.remove();
    }

    // Wrapper que esconde os controles do YouTube via overflow:hidden
    const wrapper = document.createElement('div');
    wrapper.id = 'banner-video';
    wrapper.style.cssText = [
      'position:absolute',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'overflow:hidden',
      'pointer-events:none',
      'z-index:0'
    ].join(';');

    const iframe = document.createElement('iframe');
    const params = [
      'autoplay=1',
      'mute=1',
      'loop=1',
      'playlist=' + ytId,
      'controls=0',
      'rel=0',
      'modestbranding=1',
      'showinfo=0',
      'iv_load_policy=3',
      'disablekb=1',
      'fs=0',
      'cc_load_policy=0'
    ].join('&');

    iframe.src = 'https://www.youtube.com/embed/' + ytId + '?' + params;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; encrypted-media';
    // Iframe oversized e centralizado para cortar barras/logo do YouTube
    iframe.style.cssText = [
      'position:absolute',
      'top:50%', 'left:50%',
      'width:300%', 'height:300%',
      'transform:translate(-50%,-50%)',
      'border:none',
      'pointer-events:none'
    ].join(';');

    wrapper.appendChild(iframe);
    section.insertBefore(wrapper, section.firstChild);

    // Overlay para bloquear cliques no iframe
    const overlay = document.createElement('div');
    overlay.dataset.bannerOverlay = '1';
    overlay.style.cssText = [
      'position:absolute',
      'top:0', 'left:0',
      'width:100%', 'height:100%',
      'z-index:1',
      'background:transparent'
    ].join(';');
    wrapper.insertAdjacentElement('afterend', overlay);

  } else {
    // Cloudinary: tag <video>
    let videoEl = existing;

    if (!videoEl || videoEl.tagName !== 'VIDEO') {
      if (videoEl) {
        const nextEl = videoEl.nextElementSibling;
        if (nextEl && nextEl.dataset && nextEl.dataset.bannerOverlay) nextEl.remove();
        videoEl.remove();
      }

      videoEl = document.createElement('video');
      videoEl.id = 'banner-video';
      videoEl.className = 'banner-video';
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.setAttribute('playsinline', '');
      section.insertBefore(videoEl, section.firstChild);
      registerBannerVideoEvents(videoEl);
    }

    videoEl.src = videoSrc;
    videoEl.load();
    videoEl.play().catch(() => {});
    videoEl.muted = true;
  }
}

/* --- SCROLL INTELIGENTE DO TOP 10 CORRIGIDO --- */
const top10 = document.getElementById('top10');

function scrollTop10Left() {
  const el = document.getElementById('top10');
  if (el.scrollLeft <= 0) { el.scrollLeft = el.scrollWidth; }
  else { el.scrollBy({ left: -400, behavior: 'smooth' }); }
}

function scrollTop10Right() {
  const el = document.getElementById('top10');
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) { el.scrollLeft = 0; }
  else { el.scrollBy({ left: 400, behavior: 'smooth' }); }
}

function scrollTop20Left() {
  const el = document.getElementById('top20');
  if (el.scrollLeft <= 0) { el.scrollLeft = el.scrollWidth; }
  else { el.scrollBy({ left: -400, behavior: 'smooth' }); }
}

function scrollTop20Right() {
  const el = document.getElementById('top20');
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) { el.scrollLeft = 0; }
  else { el.scrollBy({ left: 400, behavior: 'smooth' }); }
}

function scrollCategory(button, direction) {
  const container = button.parentElement.querySelector('.games-scroll');
  container.scrollLeft += direction * 300;
}

/* --- EFEITO DO HEADER NO SCROLL --- */
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (window.scrollY > 50) {
    header.style.background = 'rgba(20,20,20,0.95)';
  } else {
    header.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, transparent)';
  }
});

/* --- EVENTOS DO BANNER VIDEO (mute/unmute ao clicar) --- */
function registerBannerVideoEvents(videoEl) {
  if (!videoEl || videoEl._eventsRegistered) return;
  videoEl._eventsRegistered = true;

  videoEl.removeAttribute('loop');

  videoEl.addEventListener('ended', () => {
    videoEl.muted = true;
    videoEl.play().catch(() => {});
  });

  const bannerSection = document.getElementById('main-banner');
  if (bannerSection) {
    bannerSection.addEventListener('click', (e) => {
      if (e.target.id === 'btn-unmute') return;
      const currentVideo = document.getElementById('banner-video');
      if (currentVideo && currentVideo.tagName === 'VIDEO') {
        if (currentVideo.muted) {
          currentVideo.muted = false;
          currentVideo.volume = 0.3;
        } else {
          currentVideo.muted = true;
        }
      }
    });
  }
}

/* --- CONTROLE DO VÍDEO DO BANNER (LOOP INTELIGENTE) --- */
window.addEventListener("DOMContentLoaded", () => {
  const bannerVideo = document.getElementById("banner-video");
  if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
    registerBannerVideoEvents(bannerVideo);
  }
});

/* --- LÓGICA DO MODAL DE VÍDEO (NETFLIX STYLE) --- */
function openModal(title, desc, videoSrc) {
  const modal = document.getElementById("netflixModal");
  const modalContent = modal.querySelector(".modal-content");
  const iframe = document.getElementById("modalVideo");
  const bannerVideo = document.getElementById("banner-video");

  if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
    bannerVideo.pause();
    bannerVideo.muted = true;
  }

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalDesc").textContent = desc;

  const ytId = getYouTubeId(videoSrc);
  if (ytId) {
    iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=0&controls=1&rel=0';
  } else {
    iframe.src = videoSrc;
  }

  modalContent.style.boxShadow = "0 0 80px rgba(229, 9, 20, 0.6)";
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("netflixModal");
  const iframe = document.getElementById("modalVideo");
  const bannerVideo = document.getElementById("banner-video");

  iframe.src = "";
  modal.classList.remove("active");
  document.body.style.overflow = "";

  if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
    bannerVideo.muted = true;
    bannerVideo.play().catch(() => {});
  }
}

document.getElementById("netflixModal").addEventListener("click", e => {
  if (e.target.id === "netflixModal") closeModal();
});

/* --- DEFINE O BOTÃO "MAIS INFORMAÇÕES" PARA info.html?id=SLUG --- */
function setBannerInfoLink(title) {
  const downloadAnchor = document.getElementById('banner-link');
  const actionBtn = document.getElementById('btn-main-action');
  if (downloadAnchor && title) {
    downloadAnchor.href = 'info.html?id=' + toGameSlug(title);
    downloadAnchor.target = '_blank';
    downloadAnchor.rel = 'noopener noreferrer';
    downloadAnchor.onclick = null;
  }
  if (actionBtn) {
    actionBtn.innerHTML = "ⓘ MAIS INFORMAÇÕES";
  }
}

document.querySelectorAll('.free-game-trigger').forEach(card => {
  card.addEventListener('click', function () {
    const novaLogo = this.getAttribute('data-logo');
    const novaDesc = this.getAttribute('data-desc');
    const novoVideo = this.getAttribute('data-video');
    const dataTitle = this.getAttribute('data-title');

    document.getElementById('banner-logo').src = novaLogo;
    document.getElementById('banner-desc').textContent = novaDesc;

    setBannerVideo(novoVideo);
    setBannerInfoLink(dataTitle);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* --- LÓGICA DE LOGIN --- */
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const emailInput = document.getElementById('user-email').value;
  const passwordInput = document.getElementById('user-password').value;

  const emailCorreto = "testegratis@gameflix.com";
  const senhaCorreta = "a";

  if (emailInput === emailCorreto && passwordInput === senhaCorreta) {
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'none';

    const bannerVideo = document.getElementById("banner-video");
    const unmuteBtn = document.getElementById('btn-unmute');

    if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
      bannerVideo.muted = true;
      bannerVideo.play().catch(err => console.log("Erro no autoplay:", err));

      if (unmuteBtn) {
        unmuteBtn.style.display = 'block';

        unmuteBtn.addEventListener('click', function () {
          const currentVideo = document.getElementById('banner-video');
          if (!currentVideo || currentVideo.tagName !== 'VIDEO') { unmuteBtn.style.display = 'none'; return; }
          currentVideo.pause();
          currentVideo.muted = false;
          currentVideo.volume = 0.7;
          currentVideo.currentTime = 0;
          const playPromise = currentVideo.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              currentVideo.muted = false;
              currentVideo.volume = 0.7;
            }).catch(() => {});
          }
          unmuteBtn.style.display = 'none';
        }, { once: true });
      }
    }

    console.log("Bem-vindo ao GAMEFLIX!");
  } else {
    alert("Email ou senha incorretos. Tente novamente.");
  }
});

/* --- POPUP WHATSAPP --- */
function openWppModal() {
  const modalWpp = document.getElementById("wppModal");
  if (modalWpp) {
    modalWpp.style.display = "flex";
    document.body.style.overflow = "hidden";
    document.body.classList.add('modal-open');
  }
}

function closeWppModal() {
  const modalWpp = document.getElementById("wppModal");
  if (modalWpp) {
    modalWpp.style.display = "none";
    document.body.style.overflow = "auto";
    document.body.classList.remove('modal-open');
  }
}

window.addEventListener('click', function (event) {
  const modalWpp = document.getElementById("wppModal");
  const modalNetflix = document.getElementById("netflixModal");
  if (event.target === modalWpp) closeWppModal();
  if (event.target === modalNetflix) closeModal();
});

/* --- GERENCIADOR DE CLIQUES PADRONIZADO (TOP 10 + CATEGORIAS) --- */
document.addEventListener('click', function (e) {
  if (e.target.closest('#login-screen') || e.target.closest('#login-form')) return;

  const card = e.target.closest('.game-card, .card-container');
  if (!card) return;

  const gameData = card.querySelector('img') || card;

  const title = gameData.getAttribute('data-title');
  const desc = gameData.getAttribute('data-desc');
  const video = gameData.getAttribute('data-video');
  const logo = gameData.getAttribute('data-logo');

  if (title && video) {
    e.preventDefault();
    e.stopPropagation();

    setBannerVideo(video);

    const bannerDesc = document.getElementById('banner-desc');
    const bannerTitle = document.getElementById('banner-logo');
    if (bannerDesc) bannerDesc.textContent = desc;
    if (bannerTitle) bannerTitle.src = logo;

    setBannerInfoLink(title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
}, true);

/* ============================================================
   MODAIS DE CATEGORIA
   ============================================================ */
function openCategoryModal(cat) {
  const modal = document.getElementById('modal-' + cat);
  if (!modal) return;
  document.body.style.overflow = 'hidden';
  modal.classList.add('active');
  if (cat === 'sorteios') startRaffleCountdown();
}

function closeCategoryModal(cat) {
  const modal = document.getElementById('modal-' + cat);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.cat-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.cat-modal-overlay.active').forEach(m => {
        m.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  });
});

/* --- FAQ Accordion --- */
function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.cat-faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

/* --- Countdown Sorteio --- */
function startRaffleCountdown() {
  function update() {
    const now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth(), 30, 20, 0, 0);
    if (now >= target) target = new Date(now.getFullYear(), now.getMonth() + 1, 30, 20, 0, 0);
    const diff = target - now;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const dEl = document.getElementById('raffle-days');
    const hEl = document.getElementById('raffle-hours');
    const mEl = document.getElementById('raffle-mins');
    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
  }
  update();
  setInterval(update, 30000);
}

/* ============================================================
   BUSCA ESTILO STEAM COM DROPDOWN
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('game-search');
  const dropdown = document.getElementById('search-results-dropdown');
  if (!searchInput || !dropdown) return;

  function getAllGames() {
    const games = [];
    const seen = new Set();
    document.querySelectorAll('.game-card, .poster-img, .card-container img').forEach(el => {
      const title = el.getAttribute('data-title') || el.getAttribute('alt') || '';
      const desc = el.getAttribute('data-desc') || '';
      const img = el.getAttribute('src') || '';
      const video = el.getAttribute('data-video') || '';
      const logo = el.getAttribute('data-logo') || '';
      const dataLink = el.getAttribute('data-link') || '';
      if (title && title !== 'NOME DO JOGO' && !seen.has(title.toLowerCase())) {
        seen.add(title.toLowerCase());
        games.push({ title, desc, img, video, logo, dataLink, el });
      }
    });
    return games;
  }

  let allGames = [];
  setTimeout(() => { allGames = getAllGames(); }, 500);

  function renderResults(term) {
    if (!term) { dropdown.classList.remove('active'); return; }
    const filtered = allGames.filter(g => g.title.toLowerCase().includes(term.toLowerCase()));
    if (filtered.length === 0) {
      dropdown.innerHTML = '<div class="search-no-results"><span>🎮</span>Nenhum jogo encontrado para "<strong>' + term + '</strong>"</div>';
    } else {
      dropdown.innerHTML = filtered.slice(0, 8).map(g =>
        '<div class="search-result-item" data-title="' + g.title + '" data-desc="' + g.desc + '" data-img="' + g.img + '" data-video="' + g.video + '" data-logo="' + g.logo + '" data-link="' + g.dataLink + '">' +
        '<img class="search-result-img" src="' + g.img + '" alt="' + g.title + '" onerror="this.style.display=\'none\'">' +
        '<div class="search-result-info"><div class="search-result-title">' + g.title + '</div>' +
        '<div class="search-result-desc">' + (g.desc || 'Clique para ver o trailer') + '</div></div>' +
        '<span class="search-result-arrow">▶</span></div>'
      ).join('');
    }
    dropdown.classList.add('active');
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', function () {
        const title = this.dataset.title;
        const desc = this.dataset.desc;
        const video = this.dataset.video;
        const logo = this.dataset.logo;
        setBannerVideo(video);
        const bannerDesc = document.getElementById('banner-desc');
        const bannerLogo = document.getElementById('banner-logo');
        if (bannerDesc && desc) bannerDesc.textContent = desc;
        if (bannerLogo && logo) bannerLogo.src = logo;
        setBannerInfoLink(title);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        searchInput.value = '';
        dropdown.classList.remove('active');
      });
    });
  }

  searchInput.addEventListener('input', function () {
    const term = this.value.trim();
    if (allGames.length === 0) allGames = getAllGames();
    renderResults(term);
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#search-container') && !e.target.closest('.search-wrapper')) {
      dropdown.classList.remove('active');
    }
  });

  document.getElementById('search-container').addEventListener('click', function (e) {
    e.stopPropagation();
  });
});

// botao logo volta para o topo
document.getElementById('logo-back-to-top').addEventListener('click', function(e) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
