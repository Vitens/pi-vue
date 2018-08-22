import '../../dist/pi-vue.css'
import PIVue from 'pi-vue'

export default({
  Vue,
  options,
  router,
  siteData
}) => {
  Vue.use(PIVue, {
     url: 'https://devdata.osisoft.com/piwebapi',
     auth_header: 'Basic d2ViYXBpdXNlcjohdHJ5My4xNHdlYmFwaSE='
  })
}
