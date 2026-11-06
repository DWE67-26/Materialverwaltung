// Globale Variable für die Hauptdaten
let currentData = [];

// Funktion zum Laden der JSON-Datei
async function loadGridData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`HTTP-Fehler! Status: ${response.status}`);
    }
    currentData = await response.json();
    renderGrid(currentData, false);
  } catch (error) {
    console.error("Fehler beim Laden der JSON-Daten:", error);
    showErrorMessage("Daten konnten nicht geladen werden.");
  }
}

// Hilfsfunktion: Lädt eine lokale SVG-Datei asynchron
async function fetchSVG(iconName) {
  try {
    const response = await fetch(`icons/${iconName}.svg`);
    if (!response.ok) {
      throw new Error(`Icon nicht gefunden: ${iconName}`);
    }
    return await response.text();
  } catch (error) {
    console.warn(error.message);
    if (iconName === "arrow-left") {
      return `<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`;
    }
    return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }
}

// Render-Funktion für das Grid
async function renderGrid(items, isSubMenu = false) {
  const container = document.getElementById("materialGrid");
  if (!container) return;

  container.innerHTML = "";

  items.forEach((tileData, index) => {
    if (!tileData || !tileData.text) return;

    const tileElement = document.createElement("div");
    tileElement.className = "tile";
    const uniqueIconId = `icon-${isSubMenu ? "sub" : "main"}-${index}`;

    tileElement.innerHTML = `
            <div class="icon-container" id="${uniqueIconId}"></div>
            <span>${tileData.text}</span>
        `;

    tileElement.addEventListener("click", () => {
      if (tileData.sub && tileData.sub.length > 0) {
        renderGrid(tileData.sub, true);
      } else {
        const filterCode = tileData.text;
        window.location.href = `profile.html?code=${encodeURIComponent(filterCode)}`;
      }
    });

    container.appendChild(tileElement);

    fetchSVG(tileData.icon).then((svgCode) => {
      const iconContainer = document.getElementById(uniqueIconId);
      if (iconContainer) iconContainer.innerHTML = svgCode;
    });
  });

  if (isSubMenu) {
    const backTile = document.createElement("div");
    backTile.className = "tile back-tile";
    const backIconId = "icon-back-button";

    backTile.innerHTML = `
            <div class="icon-container" id="${backIconId}"></div>
            <span>Zurück</span>
        `;

    backTile.addEventListener("click", () => {
      renderGrid(currentData, false);
    });

    container.appendChild(backTile);

    fetchSVG("arrow-left").then((svgCode) => {
      const iconContainer = document.getElementById(backIconId);
      if (iconContainer) iconContainer.innerHTML = svgCode;
    });
  }
}

function showErrorMessage(message) {
  const container = document.getElementById("materialGrid");
  if (container) {
    container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #dc2626; font-weight: 600;">
                ${message}
            </div>
        `;
  }
}
