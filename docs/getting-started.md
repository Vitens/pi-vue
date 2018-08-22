# Getting Started

## Installation

### Bundler
If you use a bundling system such as Webpack you can add the latest version of PIVue to your Vue Project using Yarn or NPM:
```sh
# yarn
yarn add pi-vue

# npm
npm install pi-vue
```

### Browser
You can also use PIVue directly in the browser
```html
<!-- Include after Vue -->
<!-- Local files -->
<link rel="stylesheet" href="pi-vue/dist/pi-vue.css"></link>
<script src="pi-vue/dist/pi-vue.js"></script>

<!-- From CDN -->
<link rel="stylesheet" href="https://unpkg.com/pi-vue/dist/pi-vue.css"></link>
<script src="https://unpkg.com/pi-vue"></script>
```

## Usage and configuration
If you're using a bundler you need to import the plugin and associated
CSS file using:
```js
// if using a bundler:
import Vue from 'vue'
import PiVue from 'pi-vue'
// You need a specific loader for CSS files like 
// https://github.com/webpack/css-loader
import 'pi-vue/dist/pi-vue.css'
```

Before you can use PIVue you need to register it as a Vue plugin using:
```js
// register and configure plugin
Vue.use(PIVue, {
  url: '...',           // the url to the webapi server (default: '/piwebapi')
  auth_header: '...',   // optional basic auth header   (default: '')
  webid2: true          // use the new WebID 2.0 syntax (default: true)
})
```

A working example using browser imports can be found [here](http://jsfiddle.net/eywraw8t/292403/)
