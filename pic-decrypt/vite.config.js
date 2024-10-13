import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        version: '0.0.1',
        namespace: 'npm/vite-plugin-monkey',
        match: ['https://tieba.baidu.com/p/*', 'https://tieba.baidu.com/f?*', 'https://tieba.baidu.com/f?*kw=*'],
        author: 'll',
        description: 'Vite plugin for monkey',
        license: 'MIT',
        resource: {
          htmlText: 'https://llsccm.github.io/code-snippet/html/setting.html'
        }
      },
      server: {},
      build: {}
    })
  ]
})
