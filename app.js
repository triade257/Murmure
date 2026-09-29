// ===================================================================
// Murmure — étape 1 : interface + données d'exemple, sans backend.
// Les publications ci-dessous seront remplacées par de vraies données
// venant de Cloudflare D1 à l'étape suivante.
// ===================================================================

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

const STORAGE_KEY = "murmure_demo_posts_v1";

const SEED_POSTS = [
  {
    id: "seed-1",
    author: "anonyme",
    anon: true,
    time: "il y a 12 min",
    title: "Le café du matin, fenêtre ouverte",
    body: "Je me suis assise 5 minutes juste pour écouter les oiseaux. Personne ne me parlait. Juste le calme. C'était assez.",
    likes: 24,
    liked: false,
  },
  {
    id: "seed-2",
    author: "anonyme",
    anon: false,
    time: "il y a 1h",
    title: "Je suis fier d'avoir envoyé ce message",
    body: "J'ai enfin dit à mon amie que je pensais à elle. C'est sorti tout maladroit, mais vrai. Je n'ai pas regretté.",
    likes: 7,
    liked: false,
  },
  {
    id: "seed-3",
    author: "anonyme",
    anon: true,
    time: "hier · 21:34",
    title: "Petite victoire silencieuse",
    body: "J'ai choisi de sortir me promener au lieu de rester scroller. 20 minutes dehors. Je respire un peu mieux.",
    likes: 18,
    liked: false,
  },
];

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* stockage indisponible, on repart des seeds */ }
  return SEED_POSTS.slice();
}

function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) { /* pas grave si le stockage échoue */ }
}

let posts = loadPosts();

const feedEl = document.getElementById("feed");
const template = document.getElementById("post-template");

function renderFeed() {
  feedEl.innerHTML = "";

  const sectionTitle = document.createElement("h2");
  sectionTitle.className = "feed-section-title";
  sectionTitle.textContent = "(Ce qui s'est passé aujourd'hui)";
  feedEl.appendChild(sectionTitle);

  const sectionSub = document.createElement("p");
  sectionSub.className = "feed-section-sub";
  sectionSub.textContent = "Petits moments partagés, anonymes et bienveillants";
  feedEl.appendChild(sectionSub);

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Rien pour l'instant. Sois le premier à écrire quelque chose.";
    feedEl.appendChild(empty);
    return;
  }

  posts.forEach((post) => {
    const node = template.content.cloneNode(true);

    const avatar = node.querySelector(".post-avatar");
    if (post.anon) avatar.classList.add("is-anon");

    node.querySelector(".post-author").textContent = post.anon ? "anonyme" : post.author;
    node.querySelector(".post-time").textContent = post.time;

    const titleEl = node.querySelector(".post-title");
    if (post.title) {
      titleEl.textContent = post.title;
    } else {
      titleEl.remove();
    }

    node.querySelector(".post-body").textContent = post.body;

    const likeBtn = node.querySelector(".like-btn");
    const likeCount = node.querySelector(".like-count");
    likeCount.textContent = post.likes;
    likeBtn.setAttribute("aria-pressed", post.liked ? "true" : "false");

    likeBtn.addEventListener("click", () => {
      post.liked = !post.liked;
      post.likes += post.liked ? 1 : -1;
      savePosts(posts);
      renderFeed();
    });

    node.querySelector(".report-btn").addEventListener("click", () => {
      alert("Merci, ce contenu a été signalé. Il sera examiné.");
    });

    node.querySelector(".share-btn").addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({ title: "Murmure", text: post.body }).catch(() => {});
      } else {
        alert("Le partage sera bientôt disponible.");
      }
    });

    feedEl.appendChild(node);
  });
}

// ===== Onglets Pour toi / Suivis =====
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("tab--active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("tab--active");
    tab.setAttribute("aria-selected", "true");
    if (tab.dataset.tab === "suivis") {
      feedEl.innerHTML = '<p class="empty-state">Suis des personnes pour voir leurs publications ici. (Bientôt disponible.)</p>';
    } else {
      renderFeed();
    }
  });
});

// ===== Navigation basse =====
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("nav-item--active"));
    item.classList.add("nav-item--active");
    if (item.dataset.nav === "ecrire") {
      openCompose();
    } else if (item.dataset.nav === "accueil") {
      renderFeed();
    }
  });
});

// ===== Composer une publication =====
const modalEl = document.getElementById("composeModal");
const titleFieldEl = document.getElementById("composeTitle");
const bodyFieldEl = document.getElementById("composeBody");
const anonFieldEl = document.getElementById("composeAnon");

function openCompose() {
  modalEl.classList.add("is-open");
  bodyFieldEl.focus();
}

function closeCompose() {
  modalEl.classList.remove("is-open");
  titleFieldEl.value = "";
  bodyFieldEl.value = "";
  anonFieldEl.checked = true;
}

document.getElementById("composeBtn").addEventListener("click", openCompose);
document.getElementById("cancelCompose").addEventListener("click", closeCompose);
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl) closeCompose();
});

document.getElementById("publishCompose").addEventListener("click", () => {
  const newBody = bodyFieldEl.value.trim();
  if (!newBody) {
    bodyFieldEl.focus();
    return;
  }
  posts.unshift({
    id: "local-" + Date.now(),
    author: "toi",
    anon: anonFieldEl.checked,
    time: "à l'instant",
    title: titleFieldEl.value.trim(),
    body: newBody,
    likes: 0,
    liked: false,
  });
  savePosts(posts);
  closeCompose();
  document.querySelector('.tab[data-tab="pour-toi"]').click();
});

// ===== Enregistrement du service worker (PWA) =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* pas grave si ça échoue, le site reste fonctionnel sans */
    });
  });
}

renderFeed();
