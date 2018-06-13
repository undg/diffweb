// jshint esversion:6, node:true, strict:false, asi: true,

const compare = require('resemblejs').compare;
const chalk = require('chalk')
const fs = require('fs')
const puppeteer = require('puppeteer')
const rimraf = require('rimraf');

let Dw = {
  settings:{
    url:{
      domain: 'http://localhost/',
      pages:['index.php']
    },
    width:{
      small: 320,
      medium: 800,
      large: 1000,
      xlarge: 1400
    },
    folder:{
      root: 'screenshot',
      out: 'out',
      orig: 'orig',
      diff: 'diff'
    },
    diff_mode: false,
    timeout: 0,
    user_agent:{
      mobile: "Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36",
      desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
    }
  },

  timeout: function(ms){
    new Promise(resolve => setTimeout(resolve, ms))
  },

  make_screenshoot: async function (url, is_mobile, width, folder){
    console.log("width:"+chalk.blue(width)+"px    media:"+chalk.blue(is_mobile)+"    Address: "+chalk.blue(url) )
    const browser = await puppeteer.launch({args: ['--no-sandbox']})
    const page = await browser.newPage()

    let filename = url.replace(/\//g, '-')+'_'+width+'_'+is_mobile+'.png'
    let user_agent = (is_mobile === true ? this.settings.user_agent.mobile : this.settings.user_agent.desktop)

    await page.setExtraHTTPHeaders({ 'User-Agent': user_agent })
    await page.setViewport({
      width: width,
      height: 500
    })
    await page.goto(this.settings.url.domain+url)
    if(this.timeout){
      await this.timeout(this.settings.timeout)
    }
    await page.screenshot({
      path: folder + '/' + filename,
      fullPage: true
      // clip: { x: 0, y: 0, width: width, height: height }
    })
    if(this.diff_mode){
      await getDiff(filename)
    }

    await browser.close()

  },
  init: function(){
    console.log(chalk.yellow('test'))
    this.make_screenshoot(this.settings.url.pages[0], false, 1000, 'out')
  }
}

Dw.init()
