// jshint esversion:6, node:true, strict:false, asi: true,

const puppeteer   = require('puppeteer')            // making screenshots
const compare     = require('resemblejs').compare   // compare images
const chalk       = require('chalk')                // colors in console.log
const fs          = require('fs')                   // filesytem
const rimraf      = require('rimraf')               // rm -rf

let Dw = {
  delay: function(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  make_screenshoot: async function (url, is_mobile, width, folder){
    // console.log("width:"+chalk.blue(width)+"px    media:"+chalk.blue(is_mobile)+"    Address: "+chalk.blue(url) )
    const browser = await puppeteer.launch({args: ['--no-sandbox']})
    const page = await browser.newPage()

    let filename = url.replace(/\//g, '-')+'_'+width+'_'+is_mobile+'.png'
    let user_agent = (is_mobile === 'mob' ? this.settings.user_agent.mobile : this.settings.user_agent.desktop)

    await page.setExtraHTTPHeaders({ 'User-Agent': user_agent })
    await page.setViewport({
      width  : width,
      height : 500
    })
    try {
      await page.goto(this.settings.url.domain+url,{domcontentloaded: true})
    } catch(err) {
      console.log(chalk.red(this.settings.url.domain+url+" (404)"))
    }
    await this.delay(this.settings.timeout)
    await page.screenshot({
      path     : folder + '/' + filename,
      fullPage : true
      // clip: { x: 0, y: 0, width: width, height: height }
    })
    try{
      await this.get_diff(filename)
    } catch(err){
      console.log(chalk.red("orig folder is empty."), chalk.yellow("Noting to compare."))
    }
    await browser.close()
  },

  get_diff: function(filename){
    const options = {}
    const orig    = this.settings.folder.orig + filename
    const out     = this.settings.folder.out + filename
    const diff    = this.settings.folder.diff + filename

    compare(orig, out, options, function (err, data) {
      if (err || data.misMatchPercentage > this.settings.misMatch_tolerance ) {
        console.log(chalk.red('An error! --> ') + filename + ' ' + chalk.red(data.misMatchPercentage + '%'))
        fs.writeFile(diff, data.getBuffer(), "binary", (err) => {
          if(!err){var dupa = 'pupa'}
        })
      } else {
        console.log(chalk.green('All good! --> ') + filename + ' ' + chalk.green(data.misMatchPercentage + '%'))
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
    await this.make_screenshoot(url , 'mob'  , this.settings.width.small  , this.settings.folder.out)
    await this.make_screenshoot(url , 'mob'  , this.settings.width.medium , this.settings.folder.out)
    await this.make_screenshoot(url , 'desk' , this.settings.width.large  , this.settings.folder.out)
    await this.make_screenshoot(url , 'desk' , this.settings.width.xlarge , this.settings.folder.out)
  },
  init: function(){
    process.setMaxListeners(0)
    this.settings = require( "./config.json" ) // local config, copy from sample-config.json
    console.log(chalk.yellow('start'))
    this.prerun()
    this.setup()
    
    this.settings.url.pages.forEach( (el) => this.site_url(el) )
  }
}

Dw.init()
