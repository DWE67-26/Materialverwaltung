let allProfiles = [];
let currentCode = "";

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentCode = urlParams.get("code") || "";

  if (currentCode) {
    const pageTitle = document.getElementById("pageTitle");
    const pCodeInput = document.getElementById("p_code");
    if (pageTitle) pageTitle.innerText = `Lagerbestand: ${currentCode}`;
    if (pCodeInput) pCodeInput.value = currentCode;
  }

  initializeData();
  setupEventListeners();
});

async function initializeData() {
  const localData = localStorage.getItem("material_profile_data");

  if (localData) {
    allProfiles = JSON.parse(localData);
    renderTable();
  } else {
    try {
      const response = await fetch("profile_data.json");
      if (!response.ok) throw new Error("Fehler beim Laden der JSON-Datei");
      allProfiles = await response.json();
      saveToLocalStorage();
      renderTable();
    } catch (error) {
      console.error(error);
      alert("Die Profildaten konnten nicht geladen werden.");
    }
  }
}

// Funktion 1: Globales Sortieren vor dem Speichern (für LocalStorage und Export)
function saveToLocalStorage() {
  allProfiles.sort((a, b) => {
    const nameA = a.profilname || "";
    const nameB = b.profilname || "";

    // Stufe 1: Nach Namen alphabetisch/numerisch sortieren
    const nameCompare = nameA.localeCompare(nameB, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    // Stufe 2: Wenn der Name exakt gleich ist, nach Länge sortieren (kurz nach lang)
    if (nameCompare === 0) {
      return (a.laenge || 0) - (b.laenge || 0);
    }

    return nameCompare;
  });

  localStorage.setItem("material_profile_data", JSON.stringify(allProfiles));
}

// Überarbeitete Render-Funktion für die Tabelle (inkl. alphabetischer Sortierung)
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const searchInput = document.getElementById("tableSearch");
  if (!tbody || !searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  tbody.innerHTML = "";

  // Filter-Schritt 1: Nach dem Profil-Code filtern (z.B. "HEA")
  let filtered = allProfiles.filter(
    (item) => item.code.toLowerCase() === currentCode.toLowerCase(),
  );

  // Filter-Schritt 2: Nach dem Suchbegriff filtern (Name ODER Länge)
  if (searchTerm) {
    filtered = filtered.filter(
      (item) =>
        item.profilname.toLowerCase().includes(searchTerm) ||
        (item.laenge && item.laenge.toString().includes(searchTerm)),
    );
  }

  // NEU: Alphabetische Sortierung nach dem Profilnamen
  filtered.sort((a, b) => {
    const nameCompare = a.profilname.localeCompare(b.profilname, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    // Wenn Name gleich, sortiere nach Länge (aufsteigend)
    if (nameCompare === 0) {
      return a.laenge - b.laenge;
    }
    return nameCompare;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:30px;">Keine Profile gefunden.</td></tr>`;
    return;
  }

  filtered.forEach((item) => {
    const globalIndex = allProfiles.findIndex((p) => p === item);

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td><strong>${item.code}</strong></td>
            <td>${item.profilname}</td>
            <td>${item.breite} mm</td>
            <td>${item.hoehe} mm</td>
            <td>${item.laenge} mm</td>
            <td>
                <div class="quantity-control">
                    <button class="btn-qty" onclick="changeQuantity(${globalIndex}, -1)">-</button>
                    <span class="qty-value">${item.anzahl} Stk</span>
                    <button class="btn-qty" onclick="changeQuantity(${globalIndex}, 1)">+</button>
                </div>
            </td>
            <td>
                <button class="btn btn-edit" onclick="editEintrag(${globalIndex})">Ändern</button>
                <button class="btn btn-danger" onclick="deleteEintrag(${globalIndex})">Löschen</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

// NEU: Funktion zur direkten Änderung der Anzahl per Button
window.changeQuantity = function (globalIndex, change) {
  const item = allProfiles[globalIndex];
  if (!item) return;

  // Berechne die neue Anzahl
  const neueAnzahl = item.anzahl + change;

  // Verhindere, dass die Anzahl unter 0 fällt
  if (neueAnzahl >= 0) {
    item.anzahl = neueAnzahl;
    saveToLocalStorage(); // Änderung sofort im Browser sichern
    renderTable(); // Ansicht aktualisieren
  }
};

function setupEventListeners() {
  const formContainer = document.getElementById("formContainer");
  const profileForm = document.getElementById("profileForm");
  const searchInput = document.getElementById("tableSearch");
  const openFormBtn = document.getElementById("openFormBtn");
  const cancelFormBtn = document.getElementById("cancelFormBtn");

  if (searchInput) searchInput.addEventListener("input", renderTable);

  if (openFormBtn && formContainer && profileForm) {
    openFormBtn.addEventListener("click", () => {
      const formTitle = document.getElementById("formTitle");
      const pCodeInput = document.getElementById("p_code");
      const editIndexInput = document.getElementById("editIndex");

      if (formTitle) formTitle.innerText = "Neuen Eintrag anlegen";
      profileForm.reset();
      if (pCodeInput) pCodeInput.value = currentCode;
      if (editIndexInput) editIndexInput.value = "";
      formContainer.style.display = "block";
    });
  }

  if (cancelFormBtn && formContainer) {
    cancelFormBtn.addEventListener("click", () => {
      formContainer.style.display = "none";
    });
  }

  if (profileForm && formContainer) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const indexValue = document.getElementById("editIndex").value;
      const newEntry = {
        code: document.getElementById("p_code").value,
        profilname: document.getElementById("p_name").value,
        breite: parseInt(document.getElementById("p_breite").value),
        hoehe: parseInt(document.getElementById("p_hoehe").value),
        laenge: parseInt(document.getElementById("p_laenge").value),
        anzahl: parseInt(document.getElementById("p_anzahl").value),
      };

      if (indexValue === "") {
        allProfiles.push(newEntry);
      } else {
        allProfiles[parseInt(indexValue)] = newEntry;
      }

      saveToLocalStorage();
      formContainer.style.display = "none";
      renderTable();
    });
  }
}

window.editEintrag = function (globalIndex) {
  const item = allProfiles[globalIndex];
  const formContainer = document.getElementById("formContainer");
  const formTitle = document.getElementById("formTitle");

  if (!item || !formContainer) return;

  if (formTitle) formTitle.innerText = "Eintrag ändern";
  document.getElementById("editIndex").value = globalIndex;

  document.getElementById("p_code").value = item.code;
  document.getElementById("p_name").value = item.profilname;
  document.getElementById("p_breite").value = item.breite;
  document.getElementById("p_hoehe").value = item.hoehe;
  document.getElementById("p_laenge").value = item.laenge;
  document.getElementById("p_anzahl").value = item.anzahl;

  formContainer.style.display = "block";
};

window.deleteEintrag = function (globalIndex) {
  if (confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
    allProfiles.splice(globalIndex, 1);
    saveToLocalStorage();
    renderTable();
  }
};
