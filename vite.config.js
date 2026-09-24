import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'google-verification-preview',
    generateBundle: { order: 'post', handler(_, bundle) {
      const page = bundle['index.html'];
      if (page?.type === 'asset') this.emitFile({
        type: 'asset',
        fileName: 'google-calendar-review.html',
        source: String(page.source).replace('<head>', '<head>\n  <meta name="robots" content="noindex,nofollow">'),
      });
    } },
  }],
  build: { target: 'es2022' },
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
});
