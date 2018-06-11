// jshint esversion:6, strict:false
const urlArr = [
'index.html'
,'page/about.html'
]
const domain = 'http://root.domain/'

// const folder = 'orig'
const folder = 'out'
const misMatch_tolerance = 5

const chalk = require('chalk')

// COMPARE SCREENSHOTS
// /////////////////////
const compare = require('resemblejs').compare;
const fs = require('fs')

function getDiff(filename){
  const options = {};
  // The parameters can be Node Buffers
  // data is the same as usual with an additional getBuffer() function
  compare('orig/'+filename, 'out/'+filename, options, function (err, data) {
    if (err || data.misMatchPercentage > misMatch_tolerance ) {
      console.log(chalk.red('An error! --> ') + filename + ' ' + chalk.red(data.misMatchPercentage + '%'))
      fs.writeFile('diff/'+filename, data.getBuffer(), "binary", (err) => {
        if(!err){var dupa = 'pupa'}
      })
    } else {
      console.log(chalk.green('All good! --> ') + filename + ' ' + chalk.green(data.misMatchPercentage + '%'))
      // console.log(data.getBuffer())
    }
  });
}

const puppeteer = require('puppeteer')
process.setMaxListeners(0)
// MAKING SCREENSHOTS
// ///////////////////
const user_agent_mobile = 'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36'
const user_agent_desktop = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36'

var width_small = 320
var width_medium = 800
var width_large = 1000
var width_xlarge = 1400
var height = 500

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

var runTest = async (url, is_mobile, width, folder) => {
  // console.log("width:"+chalk.blue(width)+"px    media:"+chalk.blue(is_mobile)+"    Address: "+chalk.blue(url) )
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  let filename = url.replace(/\//g, '-')+'_'+width+'_'+is_mobile+'.png'
  let user_agent = (is_mobile == 'mob'? user_agent_mobile : user_agent_desktop)

  await page.setExtraHTTPHeaders({ 'User-Agent': user_agent })
  await page.setViewport({
    width: width,
    height: height
  })
  await page.goto(domain+url)
  await timeout(10000)
  await page.screenshot({
    path: folder + '/' + filename,
    fullPage: true
    // clip: { x: 0, y: 0, width: width, height: height }
  })
  await getDiff(filename)

  await browser.close()
}

// const folder = 'orig'
async function site_url(url){
  await runTest(url, 'mob', width_small, folder)
  await runTest(url, 'mob', width_medium, folder)
  await runTest(url, 'desk', width_large, folder)
  await runTest(url, 'desk', width_xlarge, folder)
}
urlArr.forEach( (el) => site_url(el) )

