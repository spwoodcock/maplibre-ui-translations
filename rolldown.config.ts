import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/maplibre-ui-translations.ts',
  output: [
    // .js keeps existing CDN links working; .cjs is required because "type": "module" makes Node read .js as ESM
    {
      file: 'dist/maplibre-ui-translations.umd.js',
      format: 'umd',
      name: 'MapLibreUITranslations',
      sourcemap: true
    },
    {
      file: 'dist/maplibre-ui-translations.umd.cjs',
      format: 'umd',
      name: 'MapLibreUITranslations',
      sourcemap: true
    }
  ],
});
