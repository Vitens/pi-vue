module.exports = {
  title: 'PIVue',
  base: '/pi-vue/',
  dest: 'docs',
  description: 'Harness the power of the Osisoft PI system and the Vue framework to build amazing dashboards and applications',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/'},
      { text: 'Guide', link: '/guide'},
    ],

    repo: 'vitens/pi-vue',
    displayAllHeaders: true,
    sidebar: [{
      title: 'Guide',
      collapsable: false,
      children: [
          '/introduction',
          '/getting-started',
          '/basic-components',
          '/charting',
          '/interactive'
      ]
    }]
  },
  configureWebpack: {
      resolve: {
        symlinks: false
      }
  },
}
