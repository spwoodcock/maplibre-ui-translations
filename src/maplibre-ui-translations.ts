import type { Map as MapLibreMap } from 'maplibre-gl';

import { en } from './locales/en.js';
import { de } from './locales/de.js';
import { es } from './locales/es.js';
import { et } from './locales/et.js';
import { fr } from './locales/fr.js';
import { it } from './locales/it.js';
import { ja } from './locales/ja.js';
import { kw } from './locales/kw.js';
import { ne } from './locales/ne.js';
import { pt } from './locales/pt.js';
import { ptBR } from './locales/pt-BR.js';
import { ru } from './locales/ru.js';

export type LocaleKey = keyof typeof en;
export type MaplibreLocale = Record<LocaleKey, string>;

// `satisfies` fails the build if a locale is missing a string
const maplibreLocales = {
    en,
    de,
    es,
    et,
    fr,
    it,
    ja,
    kw,
    ne,
    pt,
    'pt-BR': ptBR,
    ru,
} satisfies Record<string, MaplibreLocale>;

interface ControlWithContainer {
    _container?: HTMLElement;
    // Fullscreen control uses _controlContainer; its _container is the map container
    _controlContainer?: HTMLElement;
    getDefaultPosition?: () => string;
}

/** Updates the UI locale at runtime by removing and re-adding all controls. */
function updateMaplibreLocale(map: MapLibreMap, localeCode: string) {
    if (!map) return;

    const translations = (maplibreLocales as Record<string, Partial<MaplibreLocale>>)[localeCode];
    if (!translations) {
        console.warn(
            `updateMaplibreLocale: Locale '${localeCode}' not found. Falling back to English ('en').`
        );
    }

    // Merge over English so untranslated strings fall back instead of rendering blank
    const newLocale = { ...en, ...(translations ?? {}) };

    const controlsWithPositions: Array<{ control: any; position?: string }> = [];

    if ((map as any)._controls) {
        const container = (map as any)._controlContainer as HTMLElement | undefined;

        for (const control of (map as any)._controls as ControlWithContainer[]) {
            let position: string | undefined;
            const controlElement = control._controlContainer || control._container;

            if (controlElement && container) {
                const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
                for (const pos of positions) {
                    const corner = container.querySelector(`.maplibregl-ctrl-${pos}`);
                    if (corner && corner.contains(controlElement)) {
                        position = pos;
                        break;
                    }
                }
            }

            if (!position && control.getDefaultPosition) {
                position = control.getDefaultPosition();
            }

            controlsWithPositions.push({ control, position });
        }
    }

    for (const { control } of controlsWithPositions) {
        try {
            map.removeControl(control);
        } catch (err) {
            console.warn('Error removing control:', err);
        }
    }

    (map as any)._locale = newLocale;

    for (const { control, position } of controlsWithPositions) {
        try {
            map.addControl(control, position as any);
        } catch (err) {
            console.warn('Error re-adding control:', err);
        }
    }
}

export {
    updateMaplibreLocale,
    maplibreLocales,
    en,
    // Alias so the old maplibre-gl/src/ui/default_locale import is a one-line swap
    en as defaultLocale,
    de,
    es,
    et,
    fr,
    it,
    ja,
    kw,
    ne,
    pt,
    ptBR,
    ru
};
