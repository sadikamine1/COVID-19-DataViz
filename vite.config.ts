import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set base for GitHub Pages if deployed under /G-PRO-500-NCE-5-1-professionalwork-3/
  base: '/G-PRO-500-NCE-5-1-professionalwork-3/',
});
