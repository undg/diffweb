// jshint esversion:6, node:true, strict:false, asi: true,

const compare = require('resemblejs').compare;
const chalk = require('chalk')
const fs = require('fs')
const puppeteer = require('puppeteer')
const rimraf = require('rimraf');

let Dw = {
  settings:{
    first_run: false,
    diff_mode: true,
    timeout: 10000,
    misMatch_tolerance: 5,

    url:{
      domain: 'http://domain.tld',
      pages:[ 
        '/en'
      ]
    },

    width:{
      small: 320,
      medium: 750,
      large: 1000,
      xlarge: 1400
    },

    folder:{
      root: 'screenshot/',
      out: 'out/',
      orig: 'orig/',
      diff: 'diff/'
    },
    user_agent:{
      mobile: "Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36",
      desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
    }
  },

  delay: function(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  make_screenshoot: async function (url, is_mobile, width, folder){
    console.log("width:"+chalk.blue(width)+"px    media:"+chalk.blue(is_mobile)+"    Address: "+chalk.blue(url) )
    const browser = await puppeteer.launch({args: ['--no-sandbox']})
    const page = await browser.newPage()

    let filename = url.replace(/\//g, '-')+'_'+width+'_'+is_mobile+'.png'
    let user_agent = (is_mobile === 'mob' ? this.settings.user_agent.mobile : this.settings.user_agent.desktop)

    await page.setExtraHTTPHeaders({ 'User-Agent': user_agent })
    await page.setViewport({
      width: width,
      height: 500
    })
    await page.goto(this.settings.url.domain+url)
    await this.delay(this.settings.timeout)
    await page.screenshot({
      path: folder + '/' + filename,
      fullPage: true
      // clip: { x: 0, y: 0, width: width, height: height }
    })
    await this.get_diff(filename)
    await browser.close()
  },

  get_diff: function(filename){
    const options = {};
    const orig = this.settings.folder.orig + filename
    const out = this.settings.folder.out + filename
    const diff = this.settings.folder.diff + filename

    compare(orig, out, options, function (err, data) {
      if (err || data.misMatchPercentage > this.settings.misMatch_tolerance ) {
        console.log(chalk.red('An error! --> ') + filename + ' ' + chalk.red(data.misMatchPercentage + '%'))
        fs.writeFile(diff, data.getBuffer(), "binary", (err) => {
          if(!err){var dupa = 'pupa'}
        })
      } else {
        console.log(chalk.green('All good! --> ') + filename + ' ' + chalk.green(data.misMatchPercentage + '%'))
        // console.log(data.getBuffer())
      }
    }.bind(this))
    if(this.diff_mode){
console.log(chalk.yellow(this.diff_mode))
    }
  },

  setup: function(){
    if(this.first_run){
      this.diff_mode = false
      this.settings.folder.out = this.settings.folder.orig
    }
  },

  prerun: function(){
    const dirArr = [this.settings.folder.out,
                    this.settings.folder.diff,
                    this.settings.folder.orig]
    dirArr.forEach((dir)=>{if(!fs.existsSync(dir)){fs.mkdirSync(dir)}})
    rimraf('./' + this.settings.folder.diff + '*.png', ()=>console.log("diff's deleted"))

  },

  site_url: async function(url){
    await this.make_screenshoot(url, 'mob',  this.settings.width.small, this.settings.folder.out)
    await this.make_screenshoot(url, 'mob',  this.settings.width.medium, this.settings.folder.out)
    await this.make_screenshoot(url, 'desk', this.settings.width.large, this.settings.folder.out)
    await this.make_screenshoot(url, 'desk', this.settings.width.xlarge, this.settings.folder.out)
  },
  init: function(){
    process.setMaxListeners(0);
    console.log(chalk.yellow('start'))
    this.prerun()
    this.setup()
    let folder = this.settings.folder.out
    // this.make_screenshoot(this.settings.url.pages[0], false, 1000, folder)
    
    this.settings.url.pages.forEach( (el) => this.site_url(el) )
  }
}

Dw.init()
