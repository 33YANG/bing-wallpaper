const path = require('path')
const axios = require('axios')

// constants

const BING_URL_PREFIX = 'https://bing.com'

const BING_WALLPAPER_CN_URL = 'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&nc=1612409408851&pid=hp&FORM=BEHPTB&uhd=1&uhdwidth=3840&uhdheight=2160'

const READ_ME_CONTENT = `
# Bing Daily Wallpaper By NodeJS Script

> This project is only for learning and communication, please do not spread or use it for illegal purposes

## Last Week's Bing Wallpaper Preview
`

const EMAIL_FROM_USER = 'yangyata'
const EMAIL_FROM_EMAIL = 'yangyata@qq.com'
const EMAIL_FROM_PASS = 'mcswhujfuaqqcbbb'
const EMAIL_ADDRESS_LIST = ['yangyata@foxmail.com', 'yangteike@gmail.com']

// utils fn

/**
 * resolve path to absolute path
 * @param  {...any} args path
 * @returns env absolute path
 */
const resolvePath = (...args) => path.resolve(__dirname, ...args)

/**
 * make directory
 * @param {*} path path
 */
const makeDirectory = async path => {
  try {
    await fsp.mkdir(resolvePath(path), { recursive: true })
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

/**
 * get the latest bing wallpaper
 * @returns the latest bing wallpaper
 */
const getLatestWallpaper = async () => {
  const { data } = await axios.get(BING_WALLPAPER_CN_URL)
  return data.images[0]
}

module.exports = {
  BING_URL_PREFIX,
  BING_WALLPAPER_CN_URL,
  READ_ME_CONTENT,
  EMAIL_FROM_USER,
  EMAIL_FROM_EMAIL,
  EMAIL_FROM_PASS,
  EMAIL_ADDRESS_LIST,
  resolvePath,
  makeDirectory,
  getCurDate,
  getLatestWallpaper,
}
