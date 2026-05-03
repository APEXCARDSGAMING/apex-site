function normalizeCode(code) {
  return (code || "").trim().toUpperCase();
}

function goToCertificate(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return;
  window.location.href = `verify.html?id=${encodeURIComponent(normalized)}`;
}

function setupHeaderSearch() {
  const headerSearchForm = document.getElementById("headerSearchForm");
  const headerCertInput = document.getElementById("headerCertInput");

  if (!headerSearchForm || !headerCertInput) return;

  headerSearchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const code = normalizeCode(headerCertInput.value);

    if (!code) {
      alert("Ingresá un número de certificado.");
      return;
    }

    goToCertificate(code);
  });
}

function setupImageCompare() {
  const compareBox = document.getElementById("imageCompare");
  const compareTop = document.getElementById("compareTop");
  const compareDivider = document.getElementById("compareDivider");

  if (!compareBox || !compareTop || !compareDivider) return;

  let isDragging = false;

  function updateCompare(clientX) {
    const rect = compareBox.getBoundingClientRect();
    let position = ((clientX - rect.left) / rect.width) * 100;
    position = Math.max(0, Math.min(100, position));

    compareDivider.style.left = `${position}%`;
    compareTop.style.clipPath = `inset(0 0 0 ${position}%)`;
  }

  function startDrag(clientX) {
    isDragging = true;
    updateCompare(clientX);
  }

  function stopDrag() {
    isDragging = false;
  }

  compareBox.addEventListener("mousedown", (event) => startDrag(event.clientX));
  window.addEventListener("mousemove", (event) => {
    if (isDragging) updateCompare(event.clientX);
  });
  window.addEventListener("mouseup", stopDrag);

  compareBox.addEventListener("touchstart", (event) => {
    if (!event.touches.length) return;
    startDrag(event.touches[0].clientX);
  }, { passive: true });

  window.addEventListener("touchmove", (event) => {
    if (!isDragging || !event.touches.length) return;
    updateCompare(event.touches[0].clientX);
  }, { passive: true });

  window.addEventListener("touchend", stopDrag);

  compareDivider.style.left = "50%";
  compareTop.style.clipPath = "inset(0 0 0 50%)";
}

document.addEventListener("DOMContentLoaded", function () {
  setupHeaderSearch();
  setupImageCompare();
});
