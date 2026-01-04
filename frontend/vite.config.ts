import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Bắt buộc phải có 2 dòng này để chạy WASM đa luồng
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    allowedHosts: ['khoiva.id.vn'],
    host: true,
    port: 5173,
  },
  resolve: {
    alias: {
      // 👇 ÉP Vite dùng runtime WEB, không phải nodejs
      "sherpa-onnx-web":
        path.resolve(
          __dirname,
          "node_modules/sherpa-onnx/dist/sherpa-onnx-wasm-web.js"
        ),
    },
  },
   optimizeDeps: {
    include: ['sherpa-onnx'],
  },
})