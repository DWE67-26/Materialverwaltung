document.addEventListener("DOMContentLoaded", () => {
  setupAdminEventListeners();
  populateFilterDropdown();
});

// Hilfsfunktion: Holt die Daten aus dem LocalStorage
function getLocalData() {
  const localData = localStorage.getItem("material_profile_data");
  return localData ? JSON.parse(localData) : [];
}

// Befüllt das Dropdown-Menü mit allen einzigartigen Codes aus den Daten
function populateFilterDropdown() {
  const data = getLocalData();
  const select = document.getElementById("emailFilterCode");
  if (!select) return;

  // Alle einzigartigen Codes extrahieren (z.B. ["HEA", "HEB", "Flacheisen"])
  const uniqueCodes = [...new Set(data.map((item) => item.code))].sort();

  select.innerHTML = "";
  uniqueCodes.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = code;
    select.appendChild(option);
  });
}

function setupAdminEventListeners() {
  const exportBtn = document.getElementById("adminExportBtn");
  const emailBtn = document.getElementById("adminEmailBtn");
  const importBtn = document.getElementById("adminImportBtn");
  const fileInput = document.getElementById("importFile");
  const resetBtn = document.getElementById("resetStorageBtn");

  // Radio-Buttons für Toggle-Steuerung
  const scopeRadios = document.getElementsByName("emailScope");
  const filterWrapper = document.getElementById("filterScopeSelectWrapper");

  // Toggle-Logik für die Anzeige des Dropdowns
  scopeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (filterWrapper) {
        filterWrapper.style.display =
          e.target.value === "filtered" ? "block" : "none";
      }
    });
  });

  // 1. DYNAMISCHER JSON-EXPORT
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataToSend = getLocalData();
      if (dataToSend.length === 0) {
        alert("Keine Daten zum Exportieren vorhanden.");
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

  // 2. NEU: E-MAIL EXPORT MIT INHALTS-TOGGLE
  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const data = getLocalData();
      if (data.length === 0) {
        alert("Keine Daten zum Versenden vorhanden.");
        return;
      }

      // Prüfen, welcher Radio-Button aktiv ist
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
        alert("Keine Einträge für den gewählten Bereich gefunden.");
        return;
      }

      // Textbaustein für die E-Mail generieren
      let emailBody =
        "Hallo,\n\nhier ist der angeforderte Auszug aus der Materialverwaltung:\n\n";
      emailBody += "--------------------------------------------------\n";

      dataToShow.forEach((item) => {
        emailBody += `Profil: ${item.profilname}\n`;
        emailBody += `Länge:  ${item.laenge} mm\n`;
        emailBody += `Menge:  ${item.anzahl} Stk\n`;
        emailBody += "--------------------------------------------------\n";
      });

      emailBody += "\nMit freundlichen Grüßen\nMaterialverwaltung";

      // Mailto-Link generieren und aufrufen
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;
    });
  }

  // 3. VALIDIERTER FILE-IMPORT
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
            parsedData.sort((a, b) => {
              const nameA = a.profilname || "";
              const nameB = b.profilname || "";

              const nameCompare = nameA.localeCompare(nameB, undefined, {
                numeric: true,
                sensitivity: "base",
              });

              // Wenn Name identisch, nach Länge sortieren (kurz nach lang)
              if (nameCompare === 0) {
                return (a.laenge || 0) - (b.laenge || 0);
              }

              return nameCompare;
            });
            localStorage.setItem(
              "material_profile_data",
              JSON.stringify(parsedData),
            );
            alert("Daten erfolgreich importiert!");
            populateFilterDropdown(); // Dropdown nach Import aktualisieren
            fileInput.value = "";
          } else {
            alert("Fehler: Die Datei muss ein JSON-Array enthalten.");
          }
        } catch (err) {
          alert("Fehler beim Lesen: Ungültiges JSON-Format.");
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
        populateFilterDropdown();
      }
    });
  }
}
