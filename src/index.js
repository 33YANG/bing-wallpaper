'use strict'

const fs = require('fs')
const fsp = require('fs').promises
const axios = require('axios')
const { BING_URL_PREFIX, BING_WALLPAPER_CN_URL, resolvePath, makeDirectory, getCurDate, log } = require('./util')

/**
 * write readme file
 * @param {*} imageData wallpaper data
 */
async function writeReadMe(imageData) {
  // read readme.md static info
  const readMeStaticContent = await fsp.readFile(resolvePath('../readme_info.md'), 'utf8')
  // rewrite readme.md
  await fsp.writeFile(resolvePath('../readme.md'), readMeStaticContent, { flag: 'w' })

  // append wallpaper image data
  for (const item of imageData) {
    const urlWithPrefix = `${BING_URL_PREFIX}${item.url}`

    log(`[ Wallpaper Url ]`, urlWithPrefix)

    await fsp.appendFile(resolvePath('../readme.md'), '\n\r')
    await fsp.appendFile(resolvePath('../readme.md'), `- ${item?.enddate} -「 ${item?.title} 」 \n\r`)
    await fsp.appendFile(resolvePath('../readme.md'), `  ![${item?.title}](${urlWithPrefix})`)
  }
}

/**
 * save current date wallpaper to markdown file
 * @param {*} imageData[0] current date wallpaper data
 */
async function writePreviewMarkdown({ url, title, enddate }) {
  const curDate = getCurDate()
  const curMarkDownName = resolvePath(`../preview/${curDate}.md`)

  const isExist = fs.existsSync(curMarkDownName)
  if (!isExist) {
    await makeDirectory('../preview')
    await fsp.writeFile(curMarkDownName, `# ${curDate} Wallpaper Preview \n\r`, { flag: 'w+' })
  }

  await fsp.appendFile(curMarkDownName, `- ${enddate} -「 ${title} 」\n\r`)
  await fsp.appendFile(curMarkDownName, `  ![${title}](${BING_URL_PREFIX + url}) \n\r`)
}

/**
 * download current date wallpaper
 * @param {*} imageData[0] current date wallpaper data
 */
async function downLoadWallpaper({ url, title }) {
  const curMonthFolder = resolvePath(`../wallpaper/${getCurDate()}`)
  const isExist = fs.existsSync(curMonthFolder)
  if (!isExist) {
    await makeDirectory(curMonthFolder)
  }
  const { data: imageData } = await axios.get(BING_URL_PREFIX + url, {
    responseType: 'arraybuffer',
  })
  const imageBuffer = Buffer.from(imageData, 'binary')

  await fsp.writeFile(`${curMonthFolder}/${getCurDate(true)}.jpg`, imageBuffer)

  log(`[ ${getCurDate(true)} ${title} Wallpaper Saved successfully ]`)
}

/**
 * Main function, get daily bing wallpaper function
 */
async function fetchWallpaper() {
  try {
    const { data } = await axios.get(BING_WALLPAPER_CN_URL)
    if (data.images.length) {
      const lastWeekData = data.images
      await writeReadMe(lastWeekData)

      await writePreviewMarkdown(lastWeekData[0])

      await downLoadWallpaper(lastWeekData[0])
    }
  } catch (error) {
    console.log('Fetch Wallpaper Error Happened')
    console.error(error)
  }
}

fetchWallpaper()
