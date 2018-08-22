<p align="center">
  <a href="https://vitens.github.io/pi-vue" target="_blank">
    <img width="380" src="https://raw.githubusercontent.com/vitens/pi-vue/master/docs-src/.vuepress/public/hero.png" alt="logo">
  </a>
</p>

# PiVue

[![npm](https://img.shields.io/npm/v/pi-vue.svg)](https://www.npmjs.com/package/pi-vue) [![vue2](https://img.shields.io/badge/vue-2.x-brightgreen.svg)](https://vuejs.org/)

> A Vue.js Plugin

## Installation

```bash
npm install --save pi-vue
```

## Usage

### Bundler (Webpack, Rollup)

```js
import Vue from 'vue'
import PiVue from 'pi-vue'
// You need a specific loader for CSS files like https://github.com/webpack/css-loader
import 'pi-vue/dist/pi-vue.css'

Vue.use(PiVue)
```

### Browser

```html
<!-- Include after Vue -->
<!-- Local files -->
<link rel="stylesheet" href="pi-vue/dist/pi-vue.css"></link>
<script src="pi-vue/dist/pi-vue.js"></script>

<!-- From CDN -->
<link rel="stylesheet" href="https://unpkg.com/pi-vue/dist/pi-vue.css"></link>
<script src="https://unpkg.com/pi-vue"></script>
```

## Development

### Launch visual tests

```bash
npm run dev
```

### Launch Karma with coverage

```bash
npm run dev:coverage
```

### Build

Bundle the js and css of to the `dist` folder:

```bash
npm run build
```


## Publishing

The `prepublish` hook will ensure dist files are created before publishing. This
way you don't need to commit them in your repository.

```bash
# Bump the version first
# It'll also commit it and create a tag
npm version
# Push the bumped package and tags
git push --follow-tags
# Ship it 🚀
npm publish
```

## License

[MIT](http://opensource.org/licenses/MIT)
