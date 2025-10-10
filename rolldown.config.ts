import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/maplibre-ui-translations.ts',
  output: {
    file: 'dist/maplibre-ui-translations.umd.js',
    format: 'umd',
    name: 'MapLibreUITranslations',
    sourcemap: true
  },
});
