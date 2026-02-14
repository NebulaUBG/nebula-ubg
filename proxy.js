// ================================
// Scramjet Proxy Frontend Handler
// ================================

// CHANGE THIS to your Scramjet backend
const PROXY_BASE = "/scramjet/";

// Call this with the value from your search bar
function openProxy(input) {
  if (!input) return;

  input = input.trim();

  let targetUrl;

  // Full URL
  if (/^https?:\/\//i.test(input)) {
    targetUrl = input;

  // Looks like a domain (example.com)
  } else if (/^[\w-]+\.[a-z]{2,}/i.test(input)) {
    targetUrl = "https://" + input;

  // Otherwise treat as Google search
  } else {
    targetUrl =
      "https://www.google.com/search?q=" +
      encodeURIComponent(input);
  }

  // Open through Scramjet
  window.location.href =
    PROXY_BASE + encodeURIComponent(targetUrl);
}

// ================================
// Auto-hook to an existing search bar
// ================================

// CHANGE these IDs if yours are different
const form = document.getElementById("proxyform");
const input = document.getElementById("searchbar");

if (form && input) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    openProxy(input.value);
  });
}

// Optional: allow pressing Enter without a form
input?.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    openProxy(input.value);
  }
});

