import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// base './' so dist/ works from any static host or subfolder
export default defineConfig({ plugins: [solid()], base: './' });
