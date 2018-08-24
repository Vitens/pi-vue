import '../../dist/pi-vue.css'
// styles for element-ui
//
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css';
import 'element-ui/lib/theme-chalk/display.css';

import PIVue from 'pi-vue'

export default({
  Vue,
  options,
  router,
  siteData
}) => {
  Vue.use(ElementUI)
  Vue.use(PIVue, {
     url: 'https://devdata.osisoft.com/piwebapi',
     auth_header: 'Basic d2ViYXBpdXNlcjohdHJ5My4xNHdlYmFwaSE='
  })
}
