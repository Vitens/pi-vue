import '../../dist/pi-vue.css'
// styles for element-ui
//
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'

import 'element-ui/lib/theme-chalk/index.css';
import 'element-ui/lib/theme-chalk/display.css';

import PIVue from 'pi-vue'

export default({
  Vue,
  options,
  router,
  siteData
}) => {
  Vue.use(ElementUI, { locale })
  Vue.use(PIVue, {
     url: 'https://devdata.osisoft.com/piwebapi',
     auth_header: 'Basic d2ViYXBpdXNlcjohdHJ5My4xNHdlYmFwaSE=',
     webid2: true,
  })
}
