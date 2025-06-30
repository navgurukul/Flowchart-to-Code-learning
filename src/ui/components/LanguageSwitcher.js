// src/ui/components/LanguageSwitcher.js

import { getCurrentLanguage, getAvailableLanguages, setLanguage, t } from '../../i18n/i18n.js'; // Adjust path as needed

export class LanguageSwitcher {
  constructor(containerElement) {
    this.container = containerElement;
    this.render();
    this.bindEvents();

    // Listen for external language changes to update the dropdown
    document.addEventListener('languageChanged', () => this.render());
  }

  render() {
    const availableLangs = getAvailableLanguages(); // e.g., { en: "English", hi: "हिन्दी" }
    const currentLang = getCurrentLanguage();

    let optionsHtml = "";
    for (const langCode in availableLangs) {
      optionsHtml += `<option value="${langCode}" ${langCode === currentLang ? 'selected' : ''}>${availableLangs[langCode]}</option>`;
    }

    // Use the 't' function for the label of the language switcher itself
    this.container.innerHTML = `
      <label for="languageSelect">${t('labels.language')}:</label>
      <select id="languageSelect">
        ${optionsHtml}
      </select>
    `;
    // Ensure the label is also updated if it was already rendered and language changed
    const labelElement = this.container.querySelector('label[for="languageSelect"]');
    if (labelElement) {
        labelElement.textContent = `${t('labels.language')}:`;
    }

    this.selectElement = this.container.querySelector('#languageSelect');
  }

  bindEvents() {
    if (this.selectElement) {
      this.selectElement.addEventListener('change', (event) => {
        const newLang = event.target.value;
        setLanguage(newLang); // This will trigger 'languageChanged' event, which re-renders UI
      });
    }
  }
}

// Example Usage (Conceptual - requires a container element in HTML)
/*
// --- In your main application file (e.g., app.js) ---
// import { initI18n } from './i18n/i18n.js';
// import { LanguageSwitcher } from './ui/components/LanguageSwitcher.js';
//
// async function initializeApp() {
//   await initI18n('en'); // Initialize i18n, loading default or saved language
//
//   const langSwitcherContainer = document.getElementById('language-switcher-container');
//   if (langSwitcherContainer) {
//     new LanguageSwitcher(langSwitcherContainer);
//   }
//
//   // Initial render of other parts of the app that use t()
//   // document.getElementById('appTitle').textContent = t('appTitle');
//   // ...etc.
//
//   // Listen to language changes to re-render other parts of the app
//   document.addEventListener('languageChanged', () => {
//     console.log("App detected language change, re-rendering translatable elements.");
//     // document.getElementById('appTitle').textContent = t('appTitle');
//     // Re-render other components or update their text content.
//   });
// }
//
// initializeApp();
*/
