# MapLibre UI Translations

🌍 Community translations for the default MapLibre UI.

- A small plugin to bundle translation files with MapLibre.
- Allows switching locale for UI elements in MapLibre, such as
  control tooltips.
- Open for contribution.

## Install

```bash
pnpm install maplibre-ui-translations
```

## Usage

Use a single locale:

```js
// Each translation can be imported by it's 2-letter ISO code
import { fr } from 'maplibre-ui-translations';

new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/globe.json',
    center: [0, 0],
    zoom: 2,
    locale: fr,  // Use the variable here
});
```

Set the locale dynamically:

```ts
// The default English locale
import { defaultLocale } from 'maplibre-gl/src/ui/default_locale';
// Locales from this plugin
import { fr, es, de, it, ne, ptBR } from 'maplibre-ui-translations';

// We need this map to link in the defaultLocale, and map ISO code variations such as pt-BR
const localeMap: Record<string, Record<string, string>> = {
    en: defaultLocale,
    fr,
    es,
    de,
    it,
    ne,
    'pt-BR': ptBR,
};

// Set locale from locale switcher, browser context, or another source
const selectedLocaleCode = getUserLocale(); // e.g., "fr" or "pt-BR"
const selectedLocale = { ...defaultLocale, ...(localeMap[selectedLocaleCode] ?? defaultLocale) };

new maplibregl.Map({
    container: 'map',
    style: 'https://demotiles.maplibre.org/globe.json',
    center: [0, 0],
    zoom: 2,
    locale: selectedLocale,
});
```
