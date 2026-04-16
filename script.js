function normalizeCode(code) {
  return (code || "").trim().toUpperCase();
}

function findCertificate(code) {
  const normalized = normalizeCode(code);
  if (!normalized || !window.APEX_CERTIFICATES) return null;

  return window.APEX_CERTIFICATES.find(cert => cert.code === normalized) || null;
}

function goToCertificate(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return;
  window.location.href = `verify.html?code=${encodeURIComponent(normalized)}`;
}

/* =========================
   HOME SEARCH
========================= */
function setupHeaderSearch() {
  const headerSearchForm = document.getElementById("headerSearchForm");
  const headerCertInput = document.getElementById("headerCertInput");

  if (!headerSearchForm || !headerCertInput) return;

  headerSearchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const code = normalizeCode(headerCertInput.value);
    if (!code) return;

    goToCertificate(code);
  });
}

/* =========================
   OPTIONAL SEARCH SECTION
========================= */
function setupSearchSection() {
  const input = document.getElementById("certInput");
  const btn = document.getElementById("verifyBtn");
  const result = document.getElementById("verifyResult");

  if (!input || !btn) return;

  const run = () => {
    const value = input.value;
    const cert = findCertificate(value);

    if (cert) {
      if (result) {
        result.innerHTML = `Certificado encontrado: <strong>${cert.code}</strong> · ${cert.cardName}`;
      }
      goToCertificate(value);
    } else {
      if (result) {
        result.textContent = "No encontramos ese código en la base actual.";
      }
    }
  };

  btn.addEventListener("click", run);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });
}

/* =========================
   VERIFY PAGE
========================= */
function renderCertificatePage() {
  const container = document.getElementById("certContainer");
  const status = document.getElementById("certStatus");

  if (!container || !status) return;

  const params = new URLSearchParams(window.location.search);
  const code = normalizeCode(params.get("code"));
  const cert = findCertificate(code);

  if (!cert) {
    status.textContent = "Certificado no encontrado";
    container.innerHTML = `
      <div class="verify-not-found">
        <h2>No encontramos este certificado</h2>
        <p>Verificá que el código esté bien escrito y vuelva a intentar.</p>
      </div>
    `;
    return;
  }

  status.textContent = cert.status;

  const surface = cert.subgrades?.surface ?? cert.notes?.surface ?? "-";
  const corners = cert.subgrades?.corners ?? cert.notes?.corners ?? "-";
  const edges = cert.subgrades?.edges ?? cert.notes?.edges ?? "-";
  const centering = cert.subgrades?.centering ?? cert.notes?.centering ?? "-";

  const technicalSurface =
    cert.technicalAssessment?.surface ?? cert.descriptions?.surface ?? "-";
  const technicalCorners =
    cert.technicalAssessment?.corners ?? cert.descriptions?.corners ?? "-";
  const technicalEdges =
    cert.technicalAssessment?.edges ?? cert.descriptions?.edges ?? "-";
  const technicalCentering =
    cert.technicalAssessment?.centering ?? cert.descriptions?.centering ?? "-";

  const detailYear = cert.cardDetails?.year ?? cert.year ?? "-";
  const detailBrand = cert.cardDetails?.brand ?? cert.brand ?? "-";
  const detailSet = cert.cardDetails?.setName ?? cert.setName ?? "-";
  const detailCardName = cert.cardDetails?.cardName ?? cert.cardName ?? "-";
  const detailCardNumber = cert.cardDetails?.cardNumber ?? cert.variant ?? "-";

  const securityNotice =
    cert.securityNotice ??
    "Verificá que el slab físico, el label y la imagen registrada coincidan con esta ficha oficial.";

  container.innerHTML = `
    <div class="verify-hero">
      <div class="verify-slab-card">
        <img
          src="${cert.image}"
          alt="${cert.cardName}"
          class="verify-slab-image"
        />
      </div>

      <div class="verify-summary-card">
        <p class="eyebrow">Certificación oficial APEX</p>

        <div class="verify-grade-block">
          <div class="verify-grade-number">${cert.finalGradeNumber}</div>
          <div class="verify-grade-text">
            <span class="verify-grade-label">${cert.finalGradeLabel}</span>
            <small>Final Grade</small>
          </div>
        </div>

        <div class="verify-main-info">
          <div class="verify-info-row">
            <span>Certificate ID</span>
            <strong>${cert.code}</strong>
          </div>

          <div class="verify-info-row">
            <span>Status</span>
            <strong>${cert.status}</strong>
          </div>

          <div class="verify-info-row">
            <span>Card</span>
            <strong>${cert.cardName}</strong>
          </div>

          <div class="verify-info-row">
            <span>Set</span>
            <strong>${cert.year} ${cert.brand} ${cert.setName}</strong>
          </div>

          <div class="verify-info-row">
            <span>Date Certified</span>
            <strong>${cert.issuedDate}</strong>
          </div>

          <div class="verify-info-row">
            <span>Average Score</span>
            <strong>${cert.averageGrade}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="verify-section-grid">
      <section class="verify-panel">
        <div class="verify-panel-head">
          <p class="eyebrow">Subgrades</p>
          <h2>Calificación por criterio</h2>
        </div>

        <div class="verify-subgrades-grid">
          <div class="verify-subgrade-card">
            <span>Surface</span>
            <strong>${surface}</strong>
          </div>

          <div class="verify-subgrade-card">
            <span>Corners</span>
            <strong>${corners}</strong>
          </div>

          <div class="verify-subgrade-card">
            <span>Edges</span>
            <strong>${edges}</strong>
          </div>

          <div class="verify-subgrade-card">
            <span>Centering</span>
            <strong>${centering}</strong>
          </div>
        </div>

        <div class="verify-average-box">
          <span>Average Score</span>
          <strong>${cert.averageGrade}</strong>
          <p>La nota final fue asignada como <b>${cert.finalGradeNumber} ${cert.finalGradeLabel}</b> según el criterio técnico y visual de APEX.</p>
        </div>
      </section>

      <section class="verify-panel">
        <div class="verify-panel-head">
          <p class="eyebrow">Technical Assessment</p>
          <h2>Observaciones del analista</h2>
        </div>

        <div class="verify-notes">
          <p><strong>Surface:</strong> ${technicalSurface}</p>
          <p><strong>Corners:</strong> ${technicalCorners}</p>
          <p><strong>Edges:</strong> ${technicalEdges}</p>
          <p><strong>Centering:</strong> ${technicalCentering}</p>
        </div>
      </section>
    </div>

    <div class="verify-section-grid">
      <section class="verify-panel">
        <div class="verify-panel-head">
          <p class="eyebrow">Card Details</p>
          <h2>Identificación de la carta</h2>
        </div>

        <div class="verify-details-grid">
          <div class="verify-detail-item">
            <span>Year</span>
            <strong>${detailYear}</strong>
          </div>

          <div class="verify-detail-item">
            <span>Brand</span>
            <strong>${detailBrand}</strong>
          </div>

          <div class="verify-detail-item">
            <span>Set</span>
            <strong>${detailSet}</strong>
          </div>

          <div class="verify-detail-item">
            <span>Card Name</span>
            <strong>${detailCardName}</strong>
          </div>

          <div class="verify-detail-item">
            <span>Card Number</span>
            <strong>${detailCardNumber}</strong>
          </div>
        </div>
      </section>

      <section class="verify-panel">
        <div class="verify-panel-head">
          <p class="eyebrow">Security Notice</p>
          <h2>Verificación y trazabilidad</h2>
        </div>

        <div class="verify-security-note">
          <p>${securityNotice}</p>
        </div>
      </section>
    </div>
  `;
}

/* =========================
   IMAGE COMPARE
========================= */
function setupImageCompare() {
  const compareBox = document.getElementById("imageCompare");
  const compareTop = document.getElementById("compareTop");
  const compareDivider = document.getElementById("compareDivider");

  if (!compareBox || !compareTop || !compareDivider) return;

  let isDragging = false;

  function updateCompare(clientX) {
    const rect = compareBox.getBoundingClientRect();
    let position = ((clientX - rect.left) / rect.width) * 100;

    if (position < 0) position = 0;
    if (position > 100) position = 100;

    compareDivider.style.left = position + "%";
    compareTop.style.clipPath = `inset(0 0 0 ${position}%)`;
  }

  function startDrag(clientX) {
    isDragging = true;
    updateCompare(clientX);
  }

  function stopDrag() {
    isDragging = false;
  }

  compareBox.addEventListener("mousedown", function (e) {
    startDrag(e.clientX);
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDragging) return;
    updateCompare(e.clientX);
  });

  window.addEventListener("mouseup", function () {
    stopDrag();
  });

  compareBox.addEventListener(
    "touchstart",
    function (e) {
      if (!e.touches.length) return;
      startDrag(e.touches[0].clientX);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    function (e) {
      if (!isDragging || !e.touches.length) return;
      updateCompare(e.touches[0].clientX);
    },
    { passive: true }
  );

  window.addEventListener("touchend", function () {
    stopDrag();
  });

  compareDivider.style.left = "50%";
  compareTop.style.clipPath = "inset(0 0 0 50%)";
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", function () {
  setupHeaderSearch();
  setupSearchSection();
  renderCertificatePage();
  setupImageCompare();
});