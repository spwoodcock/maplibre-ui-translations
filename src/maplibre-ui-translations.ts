import type { Map as MapLibreMap } from 'maplibre-gl';

import { en, maplibreLocales, type MaplibreLocale } from './locales.generated.js';

// Re-exported wholesale so a new src/locales/<code>.json needs no change here
export * from './locales.generated.js';

const CONTROL_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

interface ControlWithContainer {
    _container?: HTMLElement;
    // Fullscreen control uses _controlContainer; its _container is the map container
    _controlContainer?: HTMLElement;
    getDefaultPosition?: () => string;
}

const localesByCode = new Map<string, MaplibreLocale>(
    Object.entries(maplibreLocales).map(([code, locale]) => [code.toLowerCase(), locale])
);

// Undefined on a miss so callers can warn; regional codes fall back to 'fr-FR' -> 'fr'
function resolveLocale(localeCode: string): MaplibreLocale | undefined {
    const code = localeCode.toLowerCase();
    return localesByCode.get(code) ?? localesByCode.get(code.split('-')[0]);
}

/** Returns the locale for a code, falling back to the base language then English. */
function getMaplibreLocale(localeCode: string): MaplibreLocale {
    return resolveLocale(localeCode) ?? en;
}

/** Updates the UI locale at runtime by removing and re-adding all controls. */
function updateMaplibreLocale(map: MapLibreMap, localeCode: string) {
    if (!map) return;

    const newLocale = resolveLocale(localeCode);
    if (!newLocale) {
        console.warn(
            `updateMaplibreLocale: Locale '${localeCode}' not found. Falling back to English ('en').`
        );
    }

    const controlsWithPositions: Array<{ control: any; position?: string }> = [];

    if ((map as any)._controls) {
        const container = (map as any)._controlContainer as HTMLElement | undefined;

        for (const control of (map as any)._controls as ControlWithContainer[]) {
            let position: string | undefined;
            const controlElement = control._controlContainer || control._container;

            if (controlElement && container) {
                for (const pos of CONTROL_POSITIONS) {
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

    (map as any)._locale = newLocale ?? en;

    for (const { control, position } of controlsWithPositions) {
        try {
            map.addControl(control, position as any);
        } catch (err) {
            console.warn('Error re-adding control:', err);
        }
    }
}

export {
    getMaplibreLocale,
    updateMaplibreLocale,
    // Alias so the old maplibre-gl/src/ui/default_locale import is a one-line swap
    en as defaultLocale
};
