import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import VueKonva from 'vue-konva'

Vue.use(VueKonva)
Vue.config.productionTip = false
Vue.component(FileReader.name, FileReader)

new Vue({
  router,
  store,
  render: function (h) { return h(App) }
}).$mount('#app')
