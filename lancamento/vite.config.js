import { defineConfig } from 'vite';
export default defineConfig({base:'./',build:{target:'es2022',chunkSizeWarningLimit:650,rollupOptions:{output:{codeSplitting:false}}},server:{host:'127.0.0.1',port:4190,strictPort:true}});
