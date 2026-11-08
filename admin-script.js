let allProfiles = [];
let currentAdminCode = ""; // NEU: Speichert den aktuellen Filter-Code

document.addEventListener("DOMContentLoaded", () => {
  // NEU: Code aus der URL auslesen (z.B. admin.html?code=HEA)
  const urlParams = new URLSearchParams(window.location.search);
  currentAdminCode = urlParams.get("code") || "";

  setupAdminEventListeners();
  populateFilterDropdown();
  initializeAdminTable();
});

function getLocalData() {
  const localData = localStorage.getItem("material_profile_data");
  return localData ? JSON.parse(localData) : [];
}

function populateFilterDropdown() {
  const data = getLocalData();
  const select = document.getElementById("emailFilterCode");
  if (!select) return;

  const uniqueCodes = [...new Set(data.map((item) => item.code))].sort();
  select.innerHTML = "";
  uniqueCodes.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code;
    select.appendChild(option);

    // NEU: Falls wir im gefilterten Bereich sind, setzen wir das E-Mail-Dropdown direkt darauf
    if (
      currentAdminCode &&
      code.toLowerCase() === currentAdminCode.toLowerCase()
    ) {
      option.selected = true;
    }
  });
}

function initializeAdminTable() {
  allProfiles = getLocalData();
  renderAdminTable();
}

function saveAdminData() {
  allProfiles.sort((a, b) => {
    const nameA = a.profilname || "";
    const nameB = b.profilname || "";
    const nameCompare = nameA.localeCompare(nameB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (nameCompare === 0) {
      return (a.laenge || 0) - (b.laenge || 0);
    }
    return nameCompare;
  });
  localStorage.setItem("material_profile_data", JSON.stringify(allProfiles));
  populateFilterDropdown();
  renderAdminTable();
}

// ÜBERARBEITET: Rendert nur noch Profile, die zum aktuellen Code passen
function renderAdminTable() {
  const tbody = document.getElementById("adminTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // SCHRITT 1: Filtern nach dem Code aus der URL (falls vorhanden)
  let filteredProfiles = allProfiles;
  if (currentAdminCode) {
    filteredProfiles = allProfiles.filter(
      (item) => item.code.toLowerCase() === currentAdminCode.toLowerCase(),
    );
  }

  if (filteredProfiles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:30px;">Keine Profile für "${currentAdminCode || "Gesamtliste"}" gefunden.</td></tr>`;
    return;
  }

  // SCHRITT 2: Nur die gefilterten Profile anzeigen
  filteredProfiles.forEach((item) => {
    // WICHTIG: Wir müssen den echten, globalen Index im allProfiles-Array finden,
    // damit beim Ändern/Löschen der richtige Eintrag getroffen wird!
    const globalIndex = allProfiles.findIndex((p) => p === item);

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td><strong>${item.code}</strong></td>
            <td>${item.profilname}</td>
            <td>${item.breite} x ${item.hoehe} x ${item.laenge} mm</td>
            <td>${item.anzahl} Stk</td>
            <td>
                <button class="btn btn-edit" onclick="editAdminEintrag(${globalIndex})">Ändern</button>
                <button class="btn btn-danger" onclick="deleteAdminEintrag(${globalIndex})">Löschen</button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

window.editAdminEintrag = function (globalIndex) {
  const item = allProfiles[globalIndex];
  const formContainer = document.getElementById("formContainer");
  if (!item || !formContainer) return;

  document.getElementById("editIndex").value = globalIndex;
  document.getElementById("p_code").value = item.code;
  document.getElementById("p_name").value = item.profilname;
  document.getElementById("p_breite").value = item.breite;
  document.getElementById("p_hoehe").value = item.hoehe;
  document.getElementById("p_laenge").value = item.laenge;
  document.getElementById("p_anzahl").value = item.anzahl;

  formContainer.style.display = "block";
};

window.deleteAdminEintrag = function (globalIndex) {
  if (confirm("Möchten Sie diesen Eintrag wirklich dauerhaft löschen?")) {
    allProfiles.splice(globalIndex, 1);
    saveAdminData();
  }
};

function setupAdminEventListeners() {
  const exportBtn = document.getElementById("adminExportBtn");
  const emailBtn = document.getElementById("adminEmailBtn");
  const importBtn = document.getElementById("adminImportBtn");
  const fileInput = document.getElementById("importFile");
  const resetBtn = document.getElementById("resetStorageBtn");

  // Formular-Elemente
  const profileForm = document.getElementById("profileForm");
  const cancelFormBtn = document.getElementById("cancelFormBtn");
  const formContainer = document.getElementById("formContainer");

  // Radio-Buttons für E-Mail Toggle
  const scopeRadios = document.getElementsByName("emailScope");
  const filterWrapper = document.getElementById("filterScopeSelectWrapper");

  scopeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (filterWrapper) {
        filterWrapper.style.display =
          e.target.value === "filtered" ? "block" : "none";
      }
    });
  });

  // Formular-Aktionen (Speichern und Abbrechen)
  if (cancelFormBtn && formContainer) {
    cancelFormBtn.addEventListener("click", () => {
      formContainer.style.display = "none";
    });
  }

  if (profileForm && formContainer) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const indexValue = document.getElementById("editIndex").value;
      const updatedEntry = {
        code: document.getElementById("p_code").value,
        profilname: document.getElementById("p_name").value,
        breite: parseInt(document.getElementById("p_breite").value),
        hoehe: parseInt(document.getElementById("p_hoehe").value),
        laenge: parseInt(document.getElementById("p_laenge").value),
        anzahl: parseInt(document.getElementById("p_anzahl").value),
      };

      if (indexValue !== "") {
        allProfiles[parseInt(indexValue)] = updatedEntry;
        saveAdminData();
        formContainer.style.display = "none";
      }
    });
  }

  // 1. JSON-EXPORT
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataToSend = getLocalData();
      if (dataToSend.length === 0) {
        alert("Keine Daten zum Exportieren.");
        return;
      }
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(dataToSend, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "profile_data.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // 2. E-MAIL VERSAND
  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const data = getLocalData();
      if (data.length === 0) {
        alert("Keine Daten vorhanden.");
        return;
      }
      const selectedScope = document.querySelector(
        'input[name="emailScope"]:checked',
      ).value;
      let dataToShow = [];
      let emailSubject = "Materialverwaltung - Aktueller Lagerbestand";

      if (selectedScope === "all") {
        dataToShow = data;
        emailSubject += " (Gesamtliste)";
      } else {
        const activeCode = document.getElementById("emailFilterCode").value;
        dataToShow = data.filter(
          (item) => item.code.toLowerCase() === activeCode.toLowerCase(),
        );
        emailSubject += ` (Bereich: ${activeCode})`;
      }

      if (dataToShow.length === 0) {
        alert("Keine Einträge gefunden.");
        return;
      }

      let emailBody =
        "Hallo,\n\nhier ist der angeforderte Auszug:\n\n--------------------------------------------------\n";
      dataToShow.forEach((item) => {
        emailBody += `Profil: ${item.profilname}\nLänge:  ${item.laenge} mm\nMenge:  ${item.anzahl} Stk\n--------------------------------------------------\n`;
      });
      emailBody += "\nMit freundlichen Grüßen\nMaterialverwaltung";
      window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    });
  }

  // 3. FILE-IMPORT
  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Bitte wähle zuerst eine JSON-Datei aus.");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const parsedData = JSON.parse(e.target.result);
          if (Array.isArray(parsedData)) {
            localStorage.setItem(
              "material_profile_data",
              JSON.stringify(parsedData),
            );
            alert("Daten erfolgreich importiert!");
            initializeAdminTable(); // Aktualisiert Admin-Tabelle und Dropdown
            fileInput.value = "";
          } else {
            alert("Fehler: Muss ein Array sein.");
          }
        } catch (err) {
          alert("Fehler: Ungültiges JSON-Format.");
        }
      };
      reader.readAsText(file);
    });
  }

  // 4. SPEICHER ZURÜCKSETZEN
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Möchtest du wirklich alle Änderungen im Browser löschen?")) {
        localStorage.removeItem("material_profile_data");
        alert("Browser-Speicher wurde gelöscht!");
        initializeAdminTable();
      }
    });
  }
}

