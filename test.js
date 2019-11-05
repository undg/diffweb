// jshint esversion:6, node:true, strict:false, asi: true,

// making screenshots
const puppeteer   = require('puppeteer')
// compare images
const resemblejs  = require('resemblejs')
// file system
const fs          = require('fs')
// rm -rf
const rimraf      = require('rimraf')
// colors in console.log
const chalk       = require('chalk')
const {red, green, yellow, blue} = chalk

// local config, copy from sample-config.js
const cfg = require( "./config.js" )

class Dw {
    delay(ms){
        return new Promise(resolve => setTimeout(resolve, ms))
    }


    async make_screenshoot(url, is_mobile, width, folder){
        const name = url.replace(/\//g, '-')
        const filename = `${name}_${width}_${is_mobile}.jpg`
        const page_url = cfg.url.domain+url
        const user_agent = is_mobile === 'mob'
            ? cfg.user_agent.mobile
            : cfg.user_agent.desktop

        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page._client.send('Animation.setPlaybackRate', { playbackRate: cfg.animation_speed });
        await page.setExtraHTTPHeaders({ 'User-Agent': user_agent })
        await page.setViewport({
            width  : width,
            height : cfg.height
        })
        try {
            await page.goto(page_url, {domcontentloaded: true})
        } catch(err) {
            console.log(red(page_url + " (404)"))
        }
        await this.delay(cfg.timeout)
        await page.screenshot({
            path     : folder + '/' + filename,
            fullPage : cfg.isFullPage,
            quality  : cfg.quality,
            // clip: { x: 0, y: 0, width: width, height: height }
        })

        await browser.close()

        this.get_diff(filename, page_url)
    }



    get_diff(filename, url){
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
        const orig    = cfg.folder.orig + filename
        const out     = cfg.folder.out  + filename
        const diff    = cfg.folder.diff + filename


        this.fileShouldExist(orig, out, url)

        resemblejs.compare(orig, out, options, (err, data) => {
            if (err || data.misMatchPercentage > cfg.misMatch_tolerance ) {
                try {
                    console.log(`${red('DIFF! --> ')}  ${red(data.misMatchPercentage + '%')} ${blue(url)} ${filename}`)
                    fs.writeFileSync(diff, data.getBuffer(), "binary")
                } catch(err) {
                    console.log(red(err))
                }
            } else {
                console.log(`${green('Good! --> ')}  ${green(data.misMatchPercentage + '%')} ${blue(url)} ${filename}`)
            }
        })
    }

    fileShouldExist(orig, out, url) {
        try {
            fs.lstatSync(orig).isFile()
        } catch(err) {
            if(err.code === "ENOENT") {
                console.log(red(orig, "is missing", yellow("Noting to compare."), url))
                console.log(yellow("Copy from:"), out, yellow("to:"), orig)
                fs.copyFileSync(out, orig)
            } else {
                console.log(red(err))
            }
        }
    }


    emptyFolders(){
        const dirArr = [
            cfg.folder.out,
            cfg.folder.diff,
            cfg.folder.orig
        ]
        dirArr.forEach(dir=>{if(!fs.existsSync(dir)){fs.mkdirSync(dir)}})
        rimraf('./' + cfg.folder.diff + '*.jpg', ()=>console.log("diff's deleted"))
        rimraf('./' + cfg.folder.out + '*.jpg', ()=>console.log("out's deleted"))
    }



    async site_url(url){
        await this.make_screenshoot(url , 'mob'  , cfg.width.small  , cfg.folder.out)
        await this.make_screenshoot(url , 'mob'  , cfg.width.medium , cfg.folder.out)
        await this.make_screenshoot(url , 'desk' , cfg.width.large  , cfg.folder.out)
        await this.make_screenshoot(url , 'desk' , cfg.width.xlarge , cfg.folder.out)
    }



    get init(){
        process.setMaxListeners(0)
        this.emptyFolders()

        cfg.url.pages.forEach( url => this.site_url(url) )
        console.log(cfg.url.pages)
    }
}

new Dw().init
