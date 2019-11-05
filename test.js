// jshint esversion:6, node:true, strict:false, asi: true,

const puppeteer   = require('puppeteer')            // making screenshots
const resemblejs  = require('resemblejs')           // compare images
const chalk       = require('chalk')                // colors in console.log
const fs          = require('fs')                   // filesytem
const rimraf      = require('rimraf')               // rm -rf

const Dw = {
    delay: function(ms){
        return new Promise(resolve => setTimeout(resolve, ms))
    },


    make_screenshoot: async function (url, is_mobile, width, folder){
        console.log("width:"+chalk.blue(width)+"px    media:"+chalk.blue(is_mobile)+"    Address: "+chalk.blue(url) )
        const filename = url.replace(/\//g, '-')+'_'+width+'_'+is_mobile+'.jpg'
        const page_url = this.settings.url.domain+url
        const user_agent = is_mobile === 'mob'
            ? this.settings.user_agent.mobile
            : this.settings.user_agent.desktop

        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page._client.send('Animation.setPlaybackRate', { playbackRate: this.settings.animation_speed });
        await page.setExtraHTTPHeaders({ 'User-Agent': user_agent })
        await page.setViewport({
            width  : width,
            height : this.settings.height
        })
        try {
            await page.goto(page_url, {domcontentloaded: true})
        } catch(err) {
            console.log(chalk.red(page_url + " (404)"))
        }
        await this.delay(this.settings.timeout)
        await page.screenshot({
            path     : folder + '/' + filename,
            fullPage : this.settings.isFullPage,
            quality  : this.settings.quality,
            // clip: { x: 0, y: 0, width: width, height: height }
        })

        await this.get_diff(filename, page_url)
        await browser.close()
    },



    get_diff: function(filename, url){
        const options = {
            output: {
                errorColor: {
                    red: 0,
                    green: 255,
                    blue: 0 
                },
                errorType: 'movement',
                transparency: 1,
                largeImageThreshold: 1200,
                useCrossOrigin: false,
                outputDiff: true
            },
            scaleToSameSize: false,
            ignore: ['nothing', 'less', 'antialiasing', 'colors', 'alpha']
        }
        const orig    = this.settings.folder.orig + filename
        const out     = this.settings.folder.out  + filename
        const diff    = this.settings.folder.diff + filename


        try {
            fs.lstatSync(orig).isFile()
        } catch(err) {
            if(err.code === "ENOENT") {
                console.log(chalk.red(orig, "missing", chalk.yellow("Noting to compare."), url))
                console.log(chalk.yellow("Copy from:"), out, chalk.yellow("to:"), orig)
                fs.copyFileSync(out, orig)
            } else {
                console.log(chalk.red(err))
            }
            return
        }

        resemblejs.compare(orig, out, options, (err, data) => {
            if (err || data.misMatchPercentage > this.settings.misMatch_tolerance ) {
                try {
                    console.log(chalk.yellow('DIFF! --> ') + filename + ' ' + chalk.red(data.misMatchPercentage + '%') + ' ' + chalk.blue(url))
                    fs.writeFileSync(diff, data.getBuffer(), "binary")
                } catch(err) {
                    console.log(chalk.red(err))
                }
            } else {
                console.log(chalk.green('Good! --> ') + filename + ' ' + chalk.green(data.misMatchPercentage + '%') + ' ' + chalk.blue(url))
            }
        })

    },



    prerun: function(){
        const dirArr = [this.settings.folder.out,
            this.settings.folder.diff,
            this.settings.folder.orig]
        dirArr.forEach((dir)=>{if(!fs.existsSync(dir)){fs.mkdirSync(dir)}})
        rimraf('./' + this.settings.folder.diff + '*.jpg', ()=>console.log("diff's deleted"))
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

        this.settings.url.pages.forEach( (el) => this.site_url(el) )
    }
}

Dw.init()
