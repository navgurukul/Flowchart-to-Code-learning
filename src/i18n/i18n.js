// src/i18n/i18n.js

const LANGUAGE_STORAGE_KEY = 'flowchartSimulatorLanguage';
let currentLanguage = 'en'; // Default language
let translations = {}; // To store loaded translations for the current language

// Available languages and their corresponding file paths
// In a larger app, this might be dynamically generated or fetched from a config
const availableLanguages = {
  en: './en.json', // Assuming en.json is in the same directory as the HTML file or correctly pathed
  hi: './hi.json', // Assuming hi.json is also accessible
};

/**
 * Loads translation file for the given language.
 * @param {string} lang - The language code (e.g., 'en', 'hi').
 * @returns {Promise<void>}
 */
async function loadTranslations(lang) {
  if (!availableLanguages[lang]) {
    console.error(`Language "${lang}" is not available. Defaulting to 'en'.`);
    lang = 'en';
  }

  try {
    const response = await fetch(availableLanguages[lang]);
    if (!response.ok) {
      throw new Error(`Failed to load translation file for ${lang}: ${response.statusText}`);
    }
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    console.log(`Translations for "${lang}" loaded successfully.`);
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    // Fallback to English if the selected language fails to load, and English isn't already the fallback
    if (lang !== 'en') {
      console.warn("Falling back to English translations.");
      await loadTranslations('en');
    } else {
        // If English itself fails, we're in trouble. Use a minimal fallback.
        translations = { appTitle: "Flowchart Simulator (Error Loading Translations)"};
    }
  }
}

/**
 * Gets the translated string for a given key.
 * Supports nested keys using dot notation (e.g., "buttons.run").
 * Supports simple replacements using {placeholder} syntax.
 * @param {string} key - The key for the translation string.
 * @param {object} [replacements={}] - An object with placeholder keys and their values.
 * @returns {string} The translated string, or the key itself if not found.
 */
export function t(key, replacements = {}) {
  let string = key.split('.').reduce((obj, k) => obj && obj[k], translations);

  if (string === undefined) {
    console.warn(`Translation not found for key: "${key}" in language "${currentLanguage}".`);
    // Fallback for missing keys: return the last part of the key or the full key.
    return key.split('.').pop() || key;
  }

  if (typeof string === 'string' && Object.keys(replacements).length > 0) {
    Object.keys(replacements).forEach(placeholder => {
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      string = string.replace(regex, replacements[placeholder]);
    });
  }

  return string;
}

/**
 * Initializes the i18n system.
 * Loads preferred language from localStorage or defaults to 'en'.
 * @param {string} [defaultLang='en'] - The default language to use.
 * @returns {Promise<void>}
 */
export async function initI18n(defaultLang = 'en') {
  const preferredLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || defaultLang;
  await loadTranslations(preferredLang);
}

/**
 * Changes the current language and reloads translations.
 * This would typically be followed by a UI refresh.
 * @param {string} lang - The new language code.
 * @returns {Promise<void>}
 */
export async function setLanguage(lang) {
  if (lang === currentLanguage && Object.keys(translations).length > 0) {
    console.log(`Language is already ${lang}.`);
    return;
  }
  await loadTranslations(lang);
  // After changing language, the application UI should be re-rendered
  // to reflect the new translations. This might involve a custom event or callback.
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Gets the current language code.
 * @returns {string}
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Gets the list of available languages.
 * @returns {object} - e.g., { en: "English", hi: "हिन्दी" } (display names could be added)
 */
export function getAvailableLanguages() {
    // For display purposes, you might want to map codes to full names
    // These names themselves could be part of the translation files for full i18n.
    const langDisplayNames = {
        en: "English",
        hi: "हिन्दी (Hindi)"
    };
    const displayableLangs = {};
    for (const code in availableLanguages) {
        displayableLangs[code] = langDisplayNames[code] || code;
    }
  return displayableLangs;
}


// Example of how UI components would re-render on language change:
// document.addEventListener('languageChanged', () => {
//   console.log("Language changed event detected. Re-rendering UI components...");
//   // Example: myAppComponent.render();
//   // Or specific components: document.getElementById('appTitle').innerText = t('appTitle');
// });
