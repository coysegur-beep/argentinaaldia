import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'argentinaaldia',
  title: 'Argentina al día — CMS',
  projectId: '99wrkpjl',
  dataset: 'production',
  plugins: [structureTool(), visionTool(), unsplashImageAsset()],
  schema: { types: schemaTypes },
});
