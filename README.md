## What for? ##

Front end web developer testing tool.
Set url's, width of browser, then capture and compare screenshots to check what part of website is affected by your code. 

Browse screenshots instead surfing in browser to check all pages, resolutions, mobile / desktop version's 

## Installation ## 

```
npm start
cp sample-config.json config.json
```

Add domain and pages to config.json, set what you want to set...

## Usage ##

`npm test`

After first run it will copy images from `out/` to `orig/`.


## Folder structure ##

`out/` folder is for fresh screenshots. If you are happy with any of screenshots here, move it to `orig/`.

`orig/` folder is for comparison with new screenshots. Keep in this folder screenshots of pages, that you want to keep the same. If they will change you will get new screenshot's in `diff/` folder. 

`diff/` folder have screenshots with highlight's of what is different between `orig/` and `out/`. Content of this folder is deleted before every run.

`config.json` - configuration file.

`test.js` - core code.

## Credits ##

https://github.com/und3rdg/diffweb
