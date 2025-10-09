import type maplibre from 'maplibre-gl';
import { defaultLocale } from 'maplibre-gl/src/ui/default_locale';

import { fr } from './fr';
import { es } from './es';
import { de } from './de';
import { it } from './it';
import { ne } from './ne';
import { pt } from './pt';
import { ptBR } from './pt-BR';
import { ja } from './ja';
import { ru } from './ru';

// Type for controls with their internal properties
interface ControlWithContainer {
    // Most controls have _container
    _container?: HTMLElement;
    // Some controls have _controlContainer, such as fullscreen control
    // (the _container is the actual map container in that case)
    _controlContainer?: HTMLElement;
    getDefaultPosition?: () => string;
}

/**
 * Updates the UI locale of a MapLibre map instance at runtime.
 * This works by removing and re-adding all controls with the new locale applied.
 */
function updateMaplibreLocale(map: maplibre.Map, localeCode: string) {
    if (!map) return;

    const localeMap: Record<string, Record<string, string>> = {
        en: defaultLocale,
        fr,
        es,
        de,
        it,
        ne,
        pt,
        'pt-BR': ptBR,
        ja,
        ru,
    };

    const newLocale = { ...defaultLocale, ...(localeMap[localeCode] || {}) };

    // Capture all existing controls with their actual positions
    const controlsWithPositions: Array<{ control: any; position?: string }> = [];
    
    if ((map as any)._controls) {
        const container = (map as any)._controlContainer as HTMLElement | undefined;
        
        for (const control of (map as any)._controls as ControlWithContainer[]) {
            let position: string | undefined;
            
            // Try _controlContainer first (for controls like FullscreenControl)
            // then fall back to _container (for most other controls)
            const controlElement = control._controlContainer || control._container;
            
            if (controlElement && container) {
                // Check which corner contains this control's element
                const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
                for (const pos of positions) {
                    const corner = container.querySelector(`.maplibregl-ctrl-${pos}`);
                    if (corner && corner.contains(controlElement)) {
                        position = pos;
                        break;
                    }
                }
            }
            
            // Fallback to getDefaultPosition if we couldn't find it in DOM
            if (!position && control.getDefaultPosition) {
                position = control.getDefaultPosition();
            }
            
            controlsWithPositions.push({ control, position });
        }
    }

    // Remove all controls
    for (const { control } of controlsWithPositions) {
        try {
            map.removeControl(control);
        } catch (err) {
            console.warn('Error removing control:', err);
        }
    }

    // Update internal locale
    (map as any)._locale = newLocale;

    // Re-add controls with their original positions
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
    fr,
    es,
    de,
    it,
    ne,
    pt,
    ptBR,
    ja,
    ru
};
