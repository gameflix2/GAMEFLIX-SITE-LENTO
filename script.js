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
   YOUTUBE IFRAME API
   ============================================================ */
var ytPlayer = null;
var ytPlayerReady = false;

// Carrega a API do YouTube uma vez
function loadYouTubeAPI() {
  if (window.YT || document.getElementById('yt-api-script')) return;
  var tag = document.createElement('script');
  tag.id = 'yt-api-script';
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

// Chamada automática pela API quando estiver pronta
window.onYouTubeIframeAPIReady = function () {
  ytPlayerReady = true;
  // Se já tiver um iframe esperando, inicializa
  if (window._pendingYtId) {
    createYTPlayer(window._pendingYtId);
    window._pendingYtId = null;
  }
};

function createYTPlayer(ytId) {
  // Destrói player anterior se existir
  if (ytPlayer) {
    try { ytPlayer.destroy(); } catch(e) {}
    ytPlayer = null;
  }

  // Garante que o container existe
  var container = document.getElementById('yt-player-container');
  if (!container) return;

  // Cria div alvo para o player
  var playerDiv = document.createElement('div');
  playerDiv.id = 'yt-actual-player';
  playerDiv.style.cssText = 'position:absolute;top:0;left:0;width:150%;height:150%;';
  container.innerHTML = '';
  container.appendChild(playerDiv);

  ytPlayer = new YT.Player('yt-actual-player', {
    videoId: ytId,
    width: '150%',
    height: '150%',
    playerVars: {
      autoplay: 1,
      mute: 1,
      loop: 1,
      playlist: ytId,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      showinfo: 0,
      iv_load_policy: 3,
      disablekb: 1,
      fs: 0,
      cc_load_policy: 0,
      playsinline: 1
    },
    events: {
onReady: function(e) {
  var iframe = e.target.getIframe(); // Pega o iframe diretamente do player
  if (iframe) {
    // Removemos o width: 100% e height: 100% daqui para o CSS externo funcionar
    iframe.style.border = 'none';
    iframe.style.pointerEvents = 'none';
  }
  e.target.mute();
  e.target.playVideo();
  showUnmuteBtn();
},
      onStateChange: function(e) {
        // Garante loop
        if (e.data === YT.PlayerState.ENDED) {
          e.target.seekTo(0);
          e.target.playVideo();
        }
      }
    }
  });
}

/* ============================================================
   BOTÃO ATIVAR SOM
   ============================================================ */
function showUnmuteBtn() {
  var btn = document.getElementById('btn-unmute');
  if (btn) btn.style.display = 'block';
}

function hideUnmuteBtn() {
  var btn = document.getElementById('btn-unmute');
  if (btn) btn.style.display = 'none';
}

function setupUnmuteButton() {
  var btn = document.getElementById('btn-unmute');
  if (!btn) return;

  // Remove listeners antigos clonando o botão
  var newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', function () {
    var currentVideo = document.getElementById('banner-video');

    // Se for YouTube (ytPlayer)
    if (ytPlayer && typeof ytPlayer.unMute === 'function') {
      ytPlayer.unMute();
      ytPlayer.setVolume(70);
      hideUnmuteBtn();
      return;
    }

    // Se for Cloudinary (<video>)
    if (currentVideo && currentVideo.tagName === 'VIDEO') {
      currentVideo.pause();
      currentVideo.muted = false;
      currentVideo.volume = 0.7;
      currentVideo.currentTime = 0;
      var p = currentVideo.play();
      if (p !== undefined) {
        p.then(function() {
          currentVideo.muted = false;
          currentVideo.volume = 0.7;
        }).catch(function(){});
      }
      hideUnmuteBtn();
    }
  });
}

/* ============================================================
   BANNER: TROCA VÍDEO (Cloudinary ou YouTube)
   ============================================================ */
function setBannerVideo(videoSrc) {
  var ytId = getYouTubeId(videoSrc);
  var section = document.getElementById('main-banner');
  if (!section) return;

  var existing = document.getElementById('banner-video');

  if (ytId) {
    loadYouTubeAPI();

    // Remove elemento anterior
    if (existing) {
      var nextEl = existing.nextElementSibling;
      if (nextEl && nextEl.dataset && nextEl.dataset.bannerOverlay) nextEl.remove();
      existing.remove();
    }

    // Wrapper com overflow:hidden para cortar controles do YouTube
    var wrapper = document.createElement('div');
    wrapper.id = 'banner-video';
    wrapper.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none;z-index:0;';

    // Container interno que receberá o player da API
    var playerContainer = document.createElement('div');
    playerContainer.id = 'yt-player-container';
    // Tamanho maior que 100% para esconder barras/logo do YouTube
    playerContainer.style.cssText = 'position:absolute;top:50%;left:50%;width:100%;height:100%;transform:translate(-50%,-50%);pointer-events:none;';

    wrapper.appendChild(playerContainer);
    section.insertBefore(wrapper, section.firstChild);

    // Overlay para bloquear cliques no iframe
    var overlay = document.createElement('div');
    overlay.dataset.bannerOverlay = '1';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;background:transparent;';
    wrapper.insertAdjacentElement('afterend', overlay);

    // Cria o player
    if (ytPlayerReady) {
      createYTPlayer(ytId);
    } else {
      window._pendingYtId = ytId;
    }

    // Reconfigura botão de som para YouTube
    setupUnmuteButton();

  } else {
    // Cloudinary: tag <video>
    // Destrói player YouTube se existir
    if (ytPlayer) {
      try { ytPlayer.destroy(); } catch(e) {}
      ytPlayer = null;
    }

    var videoEl = existing;

    if (!videoEl || videoEl.tagName !== 'VIDEO') {
      if (videoEl) {
        var nextEl2 = videoEl.nextElementSibling;
        if (nextEl2 && nextEl2.dataset && nextEl2.dataset.bannerOverlay) nextEl2.remove();
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
    videoEl.play().catch(function(){});
    videoEl.muted = true;

    // Reconfigura botão de som para Cloudinary
    setupUnmuteButton();
    showUnmuteBtn();
  }
}

/* --- SCROLL INTELIGENTE DO TOP 10 CORRIGIDO --- */
var top10 = document.getElementById('top10');

function scrollTop10Left() {
  var el = document.getElementById('top10');
  if (el.scrollLeft <= 0) { el.scrollLeft = el.scrollWidth; }
  else { el.scrollBy({ left: -400, behavior: 'smooth' }); }
}

function scrollTop10Right() {
  var el = document.getElementById('top10');
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) { el.scrollLeft = 0; }
  else { el.scrollBy({ left: 400, behavior: 'smooth' }); }
}

function scrollTop20Left() {
  var el = document.getElementById('top20');
  if (el.scrollLeft <= 0) { el.scrollLeft = el.scrollWidth; }
  else { el.scrollBy({ left: -400, behavior: 'smooth' }); }
}

function scrollTop20Right() {
  var el = document.getElementById('top20');
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) { el.scrollLeft = 0; }
  else { el.scrollBy({ left: 400, behavior: 'smooth' }); }
}

function scrollCategory(button, direction) {
  var container = button.parentElement.querySelector('.games-scroll');
  container.scrollLeft += direction * 300;
}

/* --- EFEITO DO HEADER NO SCROLL --- */
window.addEventListener('scroll', function() {
  var header = document.getElementById('header');
  if (window.scrollY > 50) {
    header.style.background = 'rgba(20,20,20,0.95)';
  } else {
    header.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, transparent)';
  }
});

/* --- EVENTOS DO BANNER VIDEO CLOUDINARY --- */
function registerBannerVideoEvents(videoEl) {
  if (!videoEl || videoEl._eventsRegistered) return;
  videoEl._eventsRegistered = true;

  videoEl.removeAttribute('loop');

  videoEl.addEventListener('ended', function() {
    videoEl.muted = true;
    videoEl.play().catch(function(){});
  });
}

/* --- CONTROLE DO VÍDEO DO BANNER INICIAL --- */
window.addEventListener("DOMContentLoaded", function() {
  loadYouTubeAPI();

  var bannerVideo = document.getElementById("banner-video");
  if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
    registerBannerVideoEvents(bannerVideo);
  }

  setupUnmuteButton();
});

/* --- LÓGICA DO MODAL DE VÍDEO (NETFLIX STYLE) --- */
function openModal(title, desc, videoSrc) {
  var modal = document.getElementById("netflixModal");
  var modalContent = modal.querySelector(".modal-content");
  var iframe = document.getElementById("modalVideo");
  var bannerVideo = document.getElementById("banner-video");

  if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
    bannerVideo.pause();
    bannerVideo.muted = true;
  }

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalDesc").textContent = desc;

  var ytId = getYouTubeId(videoSrc);
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
  var modal = document.getElementById("netflixModal");
  var iframe = document.getElementById("modalVideo");
  var bannerVideo = document.getElementById("banner-video");

  iframe.src = "";
  modal.classList.remove("active");
  document.body.style.overflow = "";

  if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
    bannerVideo.muted = true;
    bannerVideo.play().catch(function(){});
  }
}

document.getElementById("netflixModal").addEventListener("click", function(e) {
  if (e.target.id === "netflixModal") closeModal();
});

/* --- DEFINE O BOTÃO "MAIS INFORMAÇÕES" PARA info.html?id=SLUG --- */
function setBannerInfoLink(title) {
  var downloadAnchor = document.getElementById('banner-link');
  var actionBtn = document.getElementById('btn-main-action');
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

document.querySelectorAll('.free-game-trigger').forEach(function(card) {
  card.addEventListener('click', function () {
    var novaLogo = this.getAttribute('data-logo');
    var novaDesc = this.getAttribute('data-desc');
    var novoVideo = this.getAttribute('data-video');
    var dataTitle = this.getAttribute('data-title');

    document.getElementById('banner-logo').src = novaLogo;
    document.getElementById('banner-desc').textContent = novaDesc;

    setBannerVideo(novoVideo);
    setBannerInfoLink(dataTitle);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* --- LÓGICA DE LOGIN --- */
var loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', function (e) {
  e.preventDefault();

  var emailInput = document.getElementById('user-email').value;
  var passwordInput = document.getElementById('user-password').value;

  var emailCorreto = "testegratis@gameflix.com";
  var senhaCorreta = "a";

  if (emailInput === emailCorreto && passwordInput === senhaCorreta) {
    var loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'none';

    var bannerVideo = document.getElementById("banner-video");

    if (bannerVideo && bannerVideo.tagName === 'VIDEO') {
      bannerVideo.muted = true;
      bannerVideo.play().catch(function(err) { console.log("Erro no autoplay:", err); });
    }

    setupUnmuteButton();
    showUnmuteBtn();

    console.log("Bem-vindo ao GAMEFLIX!");
  } else {
    alert("Email ou senha incorretos. Tente novamente.");
  }
});

/* --- POPUP WHATSAPP --- */
function openWppModal() {
  var modalWpp = document.getElementById("wppModal");
  if (modalWpp) {
    modalWpp.style.display = "flex";
    document.body.style.overflow = "hidden";
    document.body.classList.add('modal-open');
  }
}

function closeWppModal() {
  var modalWpp = document.getElementById("wppModal");
  if (modalWpp) {
    modalWpp.style.display = "none";
    document.body.style.overflow = "auto";
    document.body.classList.remove('modal-open');
  }
}

window.addEventListener('click', function (event) {
  var modalWpp = document.getElementById("wppModal");
  var modalNetflix = document.getElementById("netflixModal");
  if (event.target === modalWpp) closeWppModal();
  if (event.target === modalNetflix) closeModal();
});

/* --- GERENCIADOR DE CLIQUES PADRONIZADO (TOP 10 + CATEGORIAS) --- */
document.addEventListener('click', function (e) {
  if (e.target.closest('#login-screen') || e.target.closest('#login-form')) return;

  var card = e.target.closest('.game-card, .card-container');
  if (!card) return;

  var gameData = card.querySelector('img') || card;

  var title = gameData.getAttribute('data-title');
  var desc = gameData.getAttribute('data-desc');
  var video = gameData.getAttribute('data-video');
  var logo = gameData.getAttribute('data-logo');

  if (title && video) {
    e.preventDefault();
    e.stopPropagation();

    setBannerVideo(video);

    var bannerDesc = document.getElementById('banner-desc');
    var bannerTitle = document.getElementById('banner-logo');
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
  var modal = document.getElementById('modal-' + cat);
  if (!modal) return;
  document.body.style.overflow = 'hidden';
  modal.classList.add('active');
  if (cat === 'sorteios') startRaffleCountdown();
}

function closeCategoryModal(cat) {
  var modal = document.getElementById('modal-' + cat);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.cat-modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.cat-modal-overlay.active').forEach(function(m) {
        m.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  });
});

/* --- FAQ Accordion --- */
function toggleFaq(item) {
  var isOpen = item.classList.contains('open');
  document.querySelectorAll('.cat-faq-item.open').forEach(function(i) { i.classList.remove('open'); });
  if (!isOpen) item.classList.add('open');
}

/* --- Countdown Sorteio --- */
function startRaffleCountdown() {
  function update() {
    var now = new Date();
    var target = new Date(now.getFullYear(), now.getMonth(), 30, 20, 0, 0);
    if (now >= target) target = new Date(now.getFullYear(), now.getMonth() + 1, 30, 20, 0, 0);
    var diff = target - now;
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var dEl = document.getElementById('raffle-days');
    var hEl = document.getElementById('raffle-hours');
    var mEl = document.getElementById('raffle-mins');
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
  var searchInput = document.getElementById('game-search');
  var dropdown = document.getElementById('search-results-dropdown');
  if (!searchInput || !dropdown) return;

  function getAllGames() {
    var games = [];
    var seen = new Set();
    document.querySelectorAll('.game-card, .poster-img, .card-container img').forEach(function(el) {
      var title = el.getAttribute('data-title') || el.getAttribute('alt') || '';
      var desc = el.getAttribute('data-desc') || '';
      var img = el.getAttribute('src') || '';
      var video = el.getAttribute('data-video') || '';
      var logo = el.getAttribute('data-logo') || '';
      var dataLink = el.getAttribute('data-link') || '';
      if (title && title !== 'NOME DO JOGO' && !seen.has(title.toLowerCase())) {
        seen.add(title.toLowerCase());
        games.push({ title: title, desc: desc, img: img, video: video, logo: logo, dataLink: dataLink, el: el });
      }
    });
    return games;
  }

  var allGames = [];
  setTimeout(function() { allGames = getAllGames(); }, 500);

  function renderResults(term) {
    if (!term) { dropdown.classList.remove('active'); return; }
    var filtered = allGames.filter(function(g) { return g.title.toLowerCase().includes(term.toLowerCase()); });
    if (filtered.length === 0) {
      dropdown.innerHTML = '<div class="search-no-results"><span>🎮</span>Nenhum jogo encontrado para "<strong>' + term + '</strong>"</div>';
    } else {
      dropdown.innerHTML = filtered.slice(0, 8).map(function(g) {
        return '<div class="search-result-item" data-title="' + g.title + '" data-desc="' + g.desc + '" data-img="' + g.img + '" data-video="' + g.video + '" data-logo="' + g.logo + '" data-link="' + g.dataLink + '">' +
        '<img class="search-result-img" src="' + g.img + '" alt="' + g.title + '" onerror="this.style.display=\'none\'">' +
        '<div class="search-result-info"><div class="search-result-title">' + g.title + '</div>' +
        '<div class="search-result-desc">' + (g.desc || 'Clique para ver o trailer') + '</div></div>' +
        '<span class="search-result-arrow">▶</span></div>';
      }).join('');
    }
    dropdown.classList.add('active');
    dropdown.querySelectorAll('.search-result-item').forEach(function(item) {
      item.addEventListener('click', function () {
        var title = this.dataset.title;
        var desc = this.dataset.desc;
        var video = this.dataset.video;
        var logo = this.dataset.logo;
        setBannerVideo(video);
        var bannerDesc = document.getElementById('banner-desc');
        var bannerLogo = document.getElementById('banner-logo');
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
    var term = this.value.trim();
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
