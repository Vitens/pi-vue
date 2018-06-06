// import Value from './components/Test.vue'
// 
// //import PIWebAPI from './piwebapi.js'
// 
// //import AsyncComputed from 'vue-async-computed'
// 
// import axios from 'axios'
// 
// function assign (target, source) { // eslint-disable-line no-unused-vars
//   for (var index = 1, key, src; index < arguments.length; ++index) {
//     src = arguments[index]
// 
//     for (key in src) {
//       if (Object.prototype.hasOwnProperty.call(src, key)) {
//         target[key] = src[key]
//       }
//     }
//   }
//   return target
// }
// 
// // Install the components
// export function install (Vue, options) {
//   const DEFAULT_OPTIONS = {
//     url: '/piwebapi',
//     auth_header: '',
//   }
// 
//   options = assign(DEFAULT_OPTIONS, options)
// 
//   axios.defaults.headers.common['Authorization'] = options['auth_header']
// 
//   //Vue.use(AsyncComputed)
//  // Vue.use(PIWebAPI, options)
// 
//   Vue.component('value', Value)
//   /* -- Add more components here -- */
// }
// 
// // Expose the components
// export {
//   Value,
//   /* -- Add more components here -- */
// }
// 
// /* -- Plugin definition & Auto-install -- */
// /* You shouldn't have to modify the code below */
// 
// // Plugin
// const plugin = {
//   /* eslint-disable no-undef */
//   version: VERSION,
//   install,
// }
// 
// export default plugin
// 
// // Auto-install
// let GlobalVue = null
// if (typeof window !== 'undefined') {
//   GlobalVue = window.Vue
// } else if (typeof global !== 'undefined') {
//   GlobalVue = global.Vue
// }
// if (GlobalVue) {
//   GlobalVue.use(plugin)
// }
