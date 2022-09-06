'use strict'

const path = require('path')
const axios = require('axios')
const fsp = require('fs').promises

// constants

const BING_URL_PREFIX = 'https://bing.com'

const BING_WALLPAPER_CN_URL = 'https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&nc=1612409408851&pid=hp&FORM=BEHPTB&uhd=1&uhdwidth=3840&uhdheight=2160'

// utils functions

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
 * get current date and format if have month index
 * @param {*} withDay is with day
 * @param {*} monthIndex is month index, default: 0, -2: pre 2th month , 3: next 3th month
 * @returns current date like '20200101'
 */
const getCurDate = (withDay, monthIndex = 0) => {
  const date = new Date()
  let curYear = date.getFullYear()

  let curMonth = date.getMonth() + 1

  if (monthIndex !== 0) {
    curYear += monthIndex > 0 ? Math.floor(monthIndex / 12) : Math.ceil(monthIndex / 12)
    monthIndex = monthIndex % 12
    curMonth += monthIndex
    if (curMonth > 12) {
      curMonth = curMonth - 12
      curYear += 1
    } else if (curMonth <= 0) {
      curMonth = curMonth + 12
      curYear -= 1
    }
  }

  curMonth = curMonth < 10 ? '0' + curMonth : curMonth

  let curDate = date.getDate()
  curDate = curDate < 10 ? '0' + curDate : curDate
  return withDay ? `${curYear}${curMonth}${curDate}` : `${curYear}${curMonth}`
}

/**
 * get the latest bing wallpaper
 * @returns the latest bing wallpaper
 */
const getLatestWallpaper = async () => {
  const { data } = await axios.get(BING_WALLPAPER_CN_URL)
  return data.images[0]
}

/**
 * log any info with current date prefix
 * @param  {...any} params all log infos
 */
const log = (...params) => {
  console.log(`[${new Date().toLocaleString()}]`, ...params)
}

module.exports = {
  BING_URL_PREFIX,
  BING_WALLPAPER_CN_URL,
  resolvePath,
  makeDirectory,
  getCurDate,
  getLatestWallpaper,
  log,
}
