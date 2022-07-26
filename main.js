const fs = require('fs')
const fsp = require('fs').promises
const axios = require('axios')
const path = require('path')

const BING_URL_PREFIX = 'https://bing.com'
const BING_WALLPAPER_CN_URL = 'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&nc=1612409408851&pid=hp&FORM=BEHPTB&uhd=1&uhdwidth=3840&uhdheight=2160'
const READ_ME_CONTENT = `
# Bing Daily Wallpaper By NodeJS Script

> This project is only for learning and communication, please do not spread or use it for illegal purposes

## Last Week's Bing Wallpaper Preview
`

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

/**
 * write readme file
 * @param {*} imageData wallpaper data
 */
const writeReadMe = async imageData => {
  // rewrite readme.md
  await fsp.writeFile(path.resolve(__dirname, './readme.md'), READ_ME_CONTENT, { flag: 'w' })

  // append wallpaper image data
  for (const item of imageData) {
    const urlWithPrefix = `${BING_URL_PREFIX}${item.url}`

    console.log(`[ ${new Date().toLocaleString()} ] [ Wallpaper Url ]`, urlWithPrefix)

    await fsp.appendFile(path.resolve(__dirname, './readme.md'), '\n\r')
    await fsp.appendFile(path.resolve(__dirname, './readme.md'), `- ${item?.enddate} -「 ${item?.title} 」 \n\r`)
    await fsp.appendFile(path.resolve(__dirname, './readme.md'), `  ![${item?.title}](${urlWithPrefix})`)
  }
}

/**
 * save current date wallpaper to markdown file
 * @param {*} imageData[0] current date wallpaper data
 */
const writePreviewMarkdown = async ({ url, title, enddate }) => {
  const curDate = getCurDate()
  const curMarkDownName = path.resolve(__dirname, `./preview/${curDate}.md`)

  const isExist = fs.existsSync(curMarkDownName)
  if (!isExist) {
    await makeDirectory(path.resolve(__dirname, './preview'))
    await fsp.writeFile(curMarkDownName, `# ${curDate} Wallpaper Preview \n\r`, { flag: 'w+' })
  }

  await fsp.appendFile(curMarkDownName, `- ${enddate} -「 ${title} 」\n\r`)
  await fsp.appendFile(curMarkDownName, `  ![${title}](${BING_URL_PREFIX + url}) \n\r`)
}

/**
 * download current date wallpaper
 * @param {*} imageData[0] current date wallpaper data
 */
const downLoadWallpaper = async ({ url, title }) => {
  const curMonthFolder = path.resolve(__dirname, `./wallpaper/${getCurDate()}`)
  const isExist = fs.existsSync(curMonthFolder)
  if (!isExist) {
    await makeDirectory(curMonthFolder)
  }
  const { data: imageData } = await axios.get(BING_URL_PREFIX + url, {
    responseType: 'arraybuffer',
  })
  const imageBuffer = Buffer.from(imageData, 'binary')

  await fsp.writeFile(`${curMonthFolder}/${getCurDate(true)}.jpg`, imageBuffer)

  console.log(`[ ${new Date().toLocaleString()} ] [ ${getCurDate(true)} ${title} Wallpaper Saved ]`)

  // TODO: compress file
  // if (new Date().getDate() === 1) {
  //   const preMonthFolder = `./wallpaper/${new Date().getFullYear()}-${new Date().getMonth()}`
  //   if (fs.existsSync(preMonthFolder)) {
  //     const zip = new jsZip()
  //     const content = await zip.folder(preMonthFolder).generateAsync({ type: 'nodebuffer' })
  //     await fsp.writeFile(`./wallpaper/${new Date().getFullYear()}-${new Date().getMonth()}.zip`, content, { flag: 'w+' })
  //     fs.rmdirSync(preMonthFolder, { recursive: true })
  //   }
  // }
}

/**
 * make directory
 * @param {*} path path
 */
const makeDirectory = async path => {
  try {
    await fsp.mkdir(path, { recursive: true })
  } catch (error) {
    console.log('Make Directory Error Happened')
    console.error(error)
  }
}

/**
 * get current date and format
 * @param {*} withDay is with day
 * @returns current date like '2020-1-1'
 */
const getCurDate = withDay => {
  const date = new Date()
  return withDay ? `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` : `${date.getFullYear()}-${date.getMonth() + 1}`
}

fetchWallpaper()
