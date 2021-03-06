import moment from 'moment'

var ES6Promise = require('es6-promise')
ES6Promise.polyfill()

import axios from 'axios'

export default {
  install (Vue, options) {
    var apiUrl = options.url
    var webid2 = options.webid2

    Vue.prototype.$http = axios

    Vue.prototype.$pi = new Vue({

      pathBuffer: [],
      valueBuffer: [],

  // webid cache
      webIdCache: {},
  // value cache, only activated for persisted objects
      valueCache: {},

      webIdMap: {},

      data: function () {
        return {
          pathToWebIdMap: {},
          attributeValues: {},
          attributeChildren: {},
          piLoading: false
        }
      },

      computed: {
        requestAttributeValues () {
          return this._.debounce(this.batchRequestAttributeValues, 5)
        },
        requestAttributeWebIds () {
          return this._.debounce(this.batchRequestAttributeWebIds, 5)
        }
      },

      methods: {

        generateWebId2 (path, type) {
          var webid = 'P1'
          if (type === 'element') {
            webid += 'Em'
          } else if (type === 'attribute') {
            webid += 'AbE'
          }
          webid += btoa(path.substring(2).toUpperCase()).replace(/=/g, '')
          return webid
        },

        getElementWebId (path) {
          var promise = new Promise(
        async function (resolve, reject) {
          if (path in this.$options.webIdCache) {
            resolve(this.$options.webIdCache[path])
            return
          }


          // check if actual path
          if (!_.startsWith(path, '\\\\')) {
            resolve(path)
            return
          }

          if(webid2) {
            resolve(this.generateWebId2(path, 'element'))
            return
          }

          var url = apiUrl + '/elements?selectedFields=WebId&path=' + encodeURIComponent(path)
          var response = await this.$http.get(url)
          var webId = response.data.WebId

          resolve(webId)
        }.bind(this)
      )
          return promise
        },

        getPointWebId (path) {
      // return promise for WebId

          var promise = new Promise(
        async function (resolve, reject) {
          // check cache
          if (path in this.$options.webIdCache) {
            resolve(this.$options.webIdCache[path])
            return
          }

          // check if actual path
          if (!this._.startsWith(path.toLowerCase(), '\\\\')) {
            resolve(path)
            return
          }

          var url = apiUrl + '/points?selectedFields=WebId&path=' + encodeURIComponent(path)
          var response = await this.$http.get(url)
          var webId = response.data.WebId

          resolve(webId)
        }.bind(this)
      )

          return promise
        },
        getWebId (path) {
          if (this._.includes(path, '|')) {
            return this.getAttributeWebId(path)
          } else if (path.split('\\').length > 4) {
            return this.getElementWebId(path)
          } else {
            return this.getPointWebId(path)
          }
        },

        getAttributeWebId (path) {
      // return promise for WebId
          // insert client side webid generation please
      //
          var promise = new Promise(
        function (resolve, reject) {
            // check cache
          if (path in this.$options.webIdCache) {
            resolve(this.$options.webIdCache[path])
            return
          }
            // check if actual path
          if (!this._.startsWith(path, '\\\\')) {
            resolve(path)
            return
          }

          if (webid2) {
            resolve(this.generateWebId2(path, 'attribute'))
            return
          }

            // add the attribute to the buffer
          this.$options.pathBuffer.push(path)
            // send debounced request for a new batch of attributes

          var request = this.requestAttributeWebIds
          request()
          if (this.$options.pathBuffer.length > 20) {
            request.flush()
          }

            // listen for
          this.$once(path + '-id', function (webid) {
            if (webid) {
                // store in cache
              this.$options.webIdCache[path] = webid

              resolve(webid)
            } else {
              reject('WebID for ' + path + 'not found')
            }
          })
        }.bind(this)
      )

          return promise
        },

        convertTime (timestr) {
          var momentObj = this.parseTime(timestr)
          return momentObj.toISOString()
        },

        parseTime (timestr) {
          if (moment.isMoment(timestr)) {
            return timestr
          }
          else if (typeof timestr === 'object') {
            return moment(timestr)
          }
          else {
            if (typeof timestr === 'number') {
              return moment(String(timestr) + '-01-01')
            }
            if (timestr === '*') {
          //
              return moment()
            }
            if (timestr.indexOf('*') === -1) {
              return moment(timestr)
            }
            var re = /(\*)(.)(\d+)(.)/i
            var matches = timestr.match(re)

            var time = moment()
            if (matches[2] === '-') {
              time.subtract(matches[3], matches[4])
            } else {
              time.add(matches[3], matches[4])
            }

            return time
          }
        },
        getInterpolated (path, start = '*-1d', end = '*', interval = '1m') {
          var promise = new Promise(
        function (resolve, reject) {
          this.getWebId(path).then(response => {
            var url = apiUrl + '/streams/' + response + '/interpolated?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&interval=' + interval + '&webIDType=PathOnly'
            this.$http.get(url).then(response => {
              resolve(response.data.Items)
            })
          }, reject => {
            resolve([])
          })
        }.bind(this))
          return promise
        },

        getSummary (path, start = '*-1d', end = '*', interval = '1h', summarytype='Average') {
          var promise = new Promise(
        function (resolve, reject) {
          this.getWebId(path).then(response => {
            var url = apiUrl + '/streams/' + response + '/summary?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&summaryDuration=' + interval + '&summaryType=' + summarytype + '&webIDType=PathOnly&filterExpression='+"'.'>-999999"
            this.$http.get(url).then(response => {
              resolve(response.data.Items)
            })
          }, reject => {
            resolve([])
          })
        }.bind(this))
          return promise
        },

        getRecorded (path, start = '*-1d', end = '*', maxCount = 10000) {
          var promise = new Promise(
        function (resolve, reject) {
          this.getWebId(path).then(response => {
            var url = apiUrl + '/streams/' + response + '/recorded?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&maxCount=' + maxCount + '&webIDType=PathOnly'
            this.$http.get(url).then(response => {
              resolve(response.data.Items)
            })
          }, reject => {
            resolve([])
          })
        }.bind(this))
          return promise
        },

        getPlot (path, start = '*-1d', end = '*', intervals = 48) {
          var promise = new Promise(
        function (resolve, reject) {
          this.getWebId(path).then(response => {
            var url = apiUrl + '/streams/' + response + '/plot?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&intervals=' + intervals + '&webIDType=PathOnly'
            this.$http.get(url).then(response => {
              resolve(response.data.Items)
            })
          }, error => {
            resolve([])
            reject(error)
          })
        }.bind(this))
          return promise
        },

        getValue (path, persist = false) {
          var promise = new Promise(
        function (resolve, reject) {
          this.getWebId(path).then(response => {
            // check cache
            if (persist && (path in this.$options.valueCache)) {
              // cache hit
              resolve(this.$options.valueCache[path])
              return
            }

            if (!_.includes(this.$options.valueBuffer, response)) {
              this.$options.valueBuffer.push(response)
              this.$options.webIdMap[response] = path
              var req = this.requestAttributeValues
              req()
              if (this.$options.valueBuffer.length > 10) {
                req.flush()
              }
            }

            this.$once(path + '-value', function (value) {
              if (value) {
                if (persist) {
                  // store in cache
                  this.$options.valueCache[path] = value
                }
                resolve(value)
              } else {
                reject(value)
              }
            })
          }).catch(error => {
            reject(error)
          })
        }.bind(this))

          return promise
        },

        batchRequestAttributeValues () {
          var url = apiUrl + '/streamsets/value?webid=' + this.$options.valueBuffer.join('&webid=') + '&webIDType=PathOnly'
      // clear buffer

          var buffer = this.$options.valueBuffer

          this.$options.valueBuffer = []
          this.$http.get(url).then(response => {
            for (var item of response.data.Items) {

              var path = this.$options.webIdMap[buffer.shift()]
              this.$options.valueBuffer = this._.without(this.$options.valueBuffer, item.WebId)
              this.$emit(path + '-value', item.Value)
              this.$set(this.attributeValues, this.$options.webIdMap[item.WebId], item.Value)
            }
          })
        },

        batchRequestAttributeWebIds () {
          var url = apiUrl + '/attributes/multiple?path=' + this.$options.pathBuffer.map(encodeURIComponent).join('&path=') + '&webIDType=PathOnly'
          var thisRequest = this.$options.pathBuffer
          this.$options.pathBuffer = []
          this.$http.get(url).then(response => {
            for (var item of response.data.Items) {
              if (!item.Object) {
                this.$emit(item.Identifier + '-id', false)
              } else {
                this.$options.webIdMap[item.Object.WebId] = item.Identifier
                this.$options.pathBuffer = this._.without(this.$options.pathBuffer, item.Identifier)
                this.$emit(item.Identifier + '-id', item.Object.WebId)
              }
            }
          }, error => {
            // error handling
            for (var item of thisRequest) {
              this.$emit(item + '-id', false)
            }
          })
        },

        parse (path, context = this.context) {
          var start = path.substring(0, 2)

          if (start === '\\\\') {
            return path
          }
          if (start === '.|' || start === '.\\') {
            return context + path.substring(1, path.length)
          }
          if (start === '..') {
            var split = context.split('\\')
            var len = path.match(/\.\./g).length
            var spliced = split.splice(-len, len)
            if (this._.includes(path, '|')) {
              return split.join('\\') + path.substring(path.indexOf('|'))
            } else {
              return split.join('\\')
            }
          }
          if (start[0] === '\\') {
            return context.split('\\').slice(0, 4).join('\\') + path
          }
          return this.context
        },

        getChildren (path) {
          var promise = new Promise(async function (resolve, reject) {
            var cachePath = path + '-children'
            if (cachePath in this.$options.valueCache) {
              resolve(this.$options.valueCache[cachePath])
              return
            }
            const webid = await this.getElementWebId(path)
            const url = apiUrl + '/elements/' + webid + '/elements?selectedFields=Items.WebId;Items.Name;Items.TemplateName;Items.Path;Items.HasChildren;' + '&webIDType=PathOnly'
            const response = await this.$http.get(url)
            this.$options.valueCache[cachePath] = response.data.Items
            resolve(response.data.Items)
          }.bind(this))

          return promise
        },

        getAttributes (path, fields) {
          var cachePath = path + '-attributes'
          var promise = new Promise(async function (resolve, reject) {
            if (cachePath in this.$options.valueCache) {
              resolve(this.$options.valueCache[cachePath])
              return
            }
            if (this._.includes(path, '|')) {
              const webid = await this.getAttributeWebId(path)
              const url = apiUrl + '/attributes/' + webid + '/attributes?selectedFields=Items.WebId;Items.Name;Items.TemplateName;Items.Path;Items.HasChildren;' + fields + '&webIDType=PathOnly'
              const response = await this.$http.get(url)
              resolve(response.data.Items)

            } else {
              const webid = await this.getElementWebId(path)
              const url = apiUrl + '/elements/' + webid + '/attributes?selectedFields=Items.WebId;Items.Name;Items.TemplateName;Items.Path;Items.HasChildren;' + fields + '&webIDType=PathOnly'
              const response = await this.$http.get(url)
              this.$options.valueCache[cachePath] = response.data.Items
              resolve(response.data.Items)
            }
          }.bind(this))

          return promise
        },

        getParents (path) {
          var promise = new Promise(async function (resolve, reject) {
            const webId = await this.getElementWebId(path)

            var url = apiUrl + '/elements/' + webId + '?webIDType=PathOnly'
            var element = await this.$http.get(url)

            element = element.data

            var response = [element]

            while (element.Links.Parent) {
              var request = await this.$http.get(element.Links.Parent + '?webIDType=PathOnly')
              element = request.data
              response.unshift(element)
            }

            resolve(response)
          }.bind(this))
          return promise
        }
      }

    })
  } }
