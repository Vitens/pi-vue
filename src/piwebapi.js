import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'

export default function(app, options) {
    var apiUrl = options.url


    app.config.globalProperties.$http = axios

    app.config.globalProperties.$pi = {

      _:_, // aliasing lodash
      $http: axios, // aliasing axios
      webid2: true,

      // $options values
      valueBuffer: {},
      // webid cache
      webIdCache: {},
      // value cache, only activated for persisted objects
      valueCache: {},

      webIdMap: {},

      pathToWebIdMap: {},
      attributeValues: {},
      attributeChildren: {},
      piLoading: false,

      debouncedRequest: undefined,

      requestAttributeValues() {
        if(!this.debouncedRequest) {
          this.debouncedRequest = this._.debounce(this.batchRequestAttributeValues.bind(this), 10)
        }
        return this.debouncedRequest
      },
    
      b64EncodeUnicode (str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes (match, p1) {
              return String.fromCharCode('0x' + p1)
            }))
      },

      generateWebId2 (path, type) {
        var webid = 'P1'
        if (type === 'element') {
          webid += 'Em'
        } else if (type === 'attribute') {
          webid += 'AbE'
        } else if (type === 'point') {
          webid += 'DP'
        }
        webid += this.b64EncodeUnicode(path.substring(2).toUpperCase()).replace(/=/g, '')
        return webid
      },

      getWebId (path) {
        if (!this._.includes(path, "\\\\")) {
          return path
        }
        if (this._.includes(path, '|')) {
          return this.generateWebId2(path, 'attribute')
        } else if (path.split('\\').length > 4) {
          return this.generateWebId2(path, 'element')
        } else {
          return this.generateWebId2(path, 'point')
        }
      },

      convertTime (timestr) {
        var momentObj = this.parseTime(timestr)
        return momentObj.toISOString()
      },

      parseTime (timestr) {
        try {
          if (moment.isMoment(timestr)) {
            return timestr
          } else if (typeof timestr === 'object') {
            return moment(timestr)
          } else {
            if (typeof timestr === 'number') {
              return moment(String(timestr) + '-01-01')
            }
            if (timestr === '*') {
          //
              return moment()
            }
            if (timestr === 't') {
              return moment().hour(0)
            }
            if (timestr.indexOf('*') !== -1) {
              var re = /(\*)(.)(\d+)(.)/i
              var matches = timestr.match(re)
              var time = moment()
            } else if (timestr.indexOf('t') !== -1) {
              var re = /(t)(.)(\d+)(.)/i
              var matches = timestr.match(re)
              var time = moment().hour(0)
            } else {
              return moment(timestr)
            }

            if (matches[2] === '-') {
              time.subtract(matches[3], matches[4])
            } else {
              time.add(matches[3], matches[4])
            }

            return moment(time)
          }
        } catch (err) {
          return null
        }
      },

      async getInterpolated (path, start = '*-1d', end = '*', interval = '1m') {
        var webid = this.getWebId(path)
        var url = apiUrl + '/streams/' + webid + '/interpolated?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&interval=' + interval + '&webIDType=PathOnly'
        var response = await this.$http.get(url)
        return response.data.Items
      },
      async getInterpolatedAtTimes (path, times=[]) {

        var webid = this.getWebId(path)

        var url = apiUrl + '/streams/' + webid + '/interpolatedattimes?time=' + times.join('&time=')
        var response = await this.$http.get(url)

        return response.data.Items
      },

      async getSummary (path, start = '*-1d', end = '*', interval = '1h', summarytype = 'Average') {

        var webid = this.getWebId(path)

        var url = apiUrl + '/streams/' + webid + '/summary?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&summaryDuration=' + interval + '&summaryType=' + summarytype + '&webIDType=PathOnly&filterExpression=' + "'.'<10000"

        var response = await this.$http.get(url)
        return response.data.Items

      },
      async getRecordedAtTimes (path, times=[]) {

        var webid = this.getWebId(path)

        var url = apiUrl + '/streams/' + webid + '/recordedattimes?time=' + times.join('&time=')
        var response = await this.$http.get(url)

        return response.data.Items
      },

      async getRecorded (path, start = '*-1d', end = '*', maxCount = 10000, boundaryType = 'inside') {

        var webid = this.getWebId(path)

        var url = apiUrl + '/streams/' + webid + '/recorded?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&maxCount=' + maxCount + '&boundaryType=' + boundaryType + '&webIDType=PathOnly'
        var response = await this.$http.get(url)

        return response.data.Items
      },

      async getPlot (path, start = '*-1d', end = '*', intervals = 48) {

        var webid = this.getWebId(path)

        var url = apiUrl + '/streams/' + webid + '/plot?startTime=' + this.convertTime(start) + '&endTime=' + this.convertTime(end) + '&intervals=' + intervals + '&webIDType=PathOnly'
        var response = await this.$http.get(url)

        return response.data.Items
      },

      async getSingleValue (path) {
        var webid = await this.getWebId(path)
        var url = apiUrl + '/streams/' + webid + '/value'
        var response = await this.$http.get(url)
        if(response.status != 200) { throw TypeError("webid not found") }

        return response.data
      },

      getValue (path, persist = false) {

        var promise = new Promise(function (resolve, reject) {
          var webid = this.getWebId(path)
          // check cache
          if (persist && (path in this.valueCache)) {
            // cache hit
            resolve(this.valueCache[path])
            return
          }



          if (!_.has(this.valueBuffer, webid)) {
            this.valueBuffer[webid] = {resolve: [resolve], reject: [reject]}
          } else {
            this.valueBuffer[webid].resolve.push(resolve)
            this.valueBuffer[webid].reject.push(reject)
          }
          var req = this.requestAttributeValues()
          req()
          if (Object.keys(this.valueBuffer).length >= 17) {
            req.flush()
          }
        }.bind(this))

        return promise
      },

      batchRequestAttributeValues () {

        var urls = Object.keys(this.valueBuffer)
        var url = apiUrl + '/streamsets/value?webid=' + urls.join('&webid=') + '&webIDType=PathOnly'
        // clear buffer

        var buffer = Object.values(this.valueBuffer)
        this.valueBuffer = []

        this.$http.get(url).then(response => {
          for (var item of response.data.Items) {
            for(var resolve of buffer.shift().resolve) {
              resolve(item.Value)
            }
          }
        }, error => {
          for (var item of response.data.Items) {
            for(var reject of buffer.shift().reject) {
              reject(item.Value)
            }
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

      async getAttributeTree (path, categoryFilter = null) {
        var webid = this.getWebId(path)
        var url = apiUrl + '/streamsets/' + webid + '/value?webIDType=PathOnly&searchFullHierarchy=true'
        if (categoryFilter) {
          url += '&categoryName=' + encodeURIComponent(categoryFilter)
        }
        const response = await this.$http.get(url)
        var items = response.data.Items

        var root = /\|(.+)/g.exec(path)[1]

        var flatmap = {}
        // create flatmap of all paths and values
        for (var item of items) {
          flatmap[/\|(.*)/g.exec(item.Path)[1]] = item
        }
        const keys = Object.keys(flatmap).sort()

        var tree = {}
        tree[root] = { name: root, value: false, path: false, webid: false, c: {}}

        var tmp

        for (var key of keys) {
          tmp = tree
          var length = key.split('|').length
          var index = 1

          for (var sub of key.split('|')) {
            if (sub in tmp) {
              tmp = tmp[sub].c
            } else {
              tmp[sub] = { name: sub, value: flatmap[key].Value, path: flatmap[key].Path, webid: flatmap[key].WebId, c: {}}
            }
            index++
          }
        }

        return tree
      },

      async getElements (path, direct = true, templateFilter = null, categoryFilter = null, sortField = null, nameFilter = null) {
        return this.getChildren(path, direct, templateFilter, categoryFilter, sortField, nameFilter)
      },
      async getChildren (path, direct = true, templateFilter = null, categoryFilter = null, sortField = null, nameFilter = null) {
        var cachePath = path + '-children' + direct + templateFilter
        if (cachePath in this.valueCache) {
          return this.valueCache[cachePath]
        }
        const webid = this.getWebId(path)
        var url = apiUrl + '/elements/' + webid + '/elements?selectedFields=Items.WebId;Items.Name;Items.TemplateName;Items.Path;Items.HasChildren;Items.Description;Items.ExtendedProperties' + '&webIDType=PathOnly'
        if (!direct) {
          url += '&searchFullHierarchy=true'
        }
        if (templateFilter !== null) {
          url += '&templateName=' + encodeURIComponent(templateFilter)
        }
        if (categoryFilter !== null) {
          url += '&categoryName=' + encodeURIComponent(categoryFilter)
        }
        if (nameFilter !== null) {
          url += '&nameFilter=' + encodeURIComponent(nameFilter)
        }
        const response = await this.$http.get(url)

        var items = response.data.Items

        if (sortField !== null) {
          var items = _.sortBy(items, sortField)
        }

        this.valueCache[cachePath] = items
        return items
      },

      async getAttributes (path, fields) {
        var cachePath = path + '-attributes'
        if (cachePath in this.valueCache) {
          return this.valueCache[cachePath]
        }
        if (this._.includes(path, '|')) {
          const webid = this.getWebId(path)
          const url = apiUrl + '/attributes/' + webid + '/attributes?selectedFields=Items.WebId;Items.Name;Items.TemplateName;Items.Path;Items.HasChildren;' + fields + '&webIDType=PathOnly'
          const response = await this.$http.get(url)
          return response.data.Items
        } else {
          const webid = this.getWebId(path)
          const url = apiUrl + '/elements/' + webid + '/attributes?selectedFields=Items.WebId;Items.Name;Items.TemplateName;Items.Path;Items.HasChildren;' + fields + '&webIDType=PathOnly'
          const response = await this.$http.get(url)
          this.valueCache[cachePath] = response.data.Items
          return response.data.Items
        }
      },

      async getParents (path) {
        const webId = this.getWebId(path)

        var url = apiUrl + '/elements/' + webId + '?webIDType=PathOnly'
        var element = await this.$http.get(url)

        element = element.data

        var response = [element]

        while (element.Links.Parent) {
          var request = await this.$http.get(element.Links.Parent + '?webIDType=PathOnly')
          element = request.data
          response.unshift(element)
        }

        return response
    }
  }
}