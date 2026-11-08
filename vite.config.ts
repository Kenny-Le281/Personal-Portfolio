import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://kenny-le281.github.io/Personal-Portfolio/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/Personal-Portfolio/' : '/',
});
