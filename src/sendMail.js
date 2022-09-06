'use strict'

require('dotenv').config()
const fs = require('fs')
const fsp = require('fs').promises
const archiver = require('archiver')
const nodemailer = require('nodemailer')
const { BING_URL_PREFIX, resolvePath, getLatestWallpaper, getCurDate, log } = require('./util')

const commandLineParams = process.argv.slice(2)
const EMAIL_FROM_EMAIL = process.env.EMAIL_FROM_EMAIL || commandLineParams[0].split('=')[1]
const EMAIL_FROM_PASS = process.env.EMAIL_FROM_PASS || commandLineParams[1].split('=')[1]
const EMAIL_FROM_USER = EMAIL_FROM_EMAIL.split('@')[0]
const EMAIL_ADDRESS_LIST = process.env.EMAIL_ADDRESS_LIST || commandLineParams[2].split('=')[1]

/**
 * compress directory use archiver
 * @param {string} dirPath compress folder path
 * @param {string} zipPath .zip file path
 * @returns promise compress fn
 */
function zipDirectory(dirPath, zipPath) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    })

    archive.on('error', err => {
      log(`Error while archiving:`, err)
      reject(err)
    })

    archive.pipe(fs.createWriteStream(zipPath))

    archive.directory(dirPath, false)
    archive.finalize()

    archive.on('end', () => {
      resolve()
    })
  })
}

/**
 *  send wallpaper zip by nodemailer
 * @param {*} zipPath
 */
async function sendMail(zipPath) {
  const transporter = nodemailer.createTransport({
    service: 'qq',
    port: 465,
    secureConnection: true,
    auth: {
      user: EMAIL_FROM_EMAIL,
      pass: EMAIL_FROM_PASS,
    },
  })

  const curDate = getCurDate()
  const latestWallpaper = await getLatestWallpaper()

  const mailOption = {
    from: `${EMAIL_FROM_USER}<${EMAIL_FROM_EMAIL}>`,
    to: EMAIL_ADDRESS_LIST,
    subject: `${curDate} Bing Wallpaper Zip`,
    html: `<h2>Bing Daily Wallpaper</h2><p>${latestWallpaper.enddate} - ${latestWallpaper.title}<p><img src="${
      BING_URL_PREFIX + latestWallpaper.url
    }" alt="wallpaper" style="width: 800px"/>`,
    attachments: [
      {
        filename: `${curDate}-wallpaper.zip`,
        path: zipPath,
        cid: Math.random().toString(36).substring(2),
      },
    ],
  }

  transporter.sendMail(mailOption, (error, info) => {
    if (error) {
      log(`Error while sending mail: `, error)
    } else {
      log(`Mail from ${EMAIL_FROM_EMAIL} sent to ${EMAIL_ADDRESS_LIST} done:`, info.response)
    }
  })
}

async function compressFolderSendMail() {
  try {
    const curDay = new Date().getDate()
    // per 1st day of month handle send wallpaper
    if (curDay === 1) {
      // handle previous month data, compress to zip and remove folder
      const preMonthWallpaperDir = resolvePath(`../wallpaper/${getCurDate(false, -1)}`)
      const preMonthWallpaperZip = resolvePath(`${preMonthWallpaperDir}.zip`)
      log(`Compressing ${preMonthWallpaperDir} to ${preMonthWallpaperZip}`)

      if (fs.existsSync(preMonthWallpaperDir)) {
        await zipDirectory(preMonthWallpaperDir, preMonthWallpaperZip)

        await fsp.rm(preMonthWallpaperDir, { recursive: true })
        log(`Remove ${preMonthWallpaperDir} successfully`)

        // delete previous previous month wallpaper zip if exists
        const prePreMonthWallpaperZip = resolvePath(`../wallpaper/${getCurDate(false, -2)}.zip`)
        if (fs.existsSync(prePreMonthWallpaperZip)) {
          await fsp.rm(prePreMonthWallpaperZip)
          log(`Delete ${prePreMonthWallpaperZip} success`)
        }
      } else {
        log(`Folder ${preMonthWallpaperDir} doesn't exist`)
      }

      if (fs.existsSync(preMonthWallpaperZip)) {
        log(`Sending mail ${preMonthWallpaperZip}`)
        await sendMail(preMonthWallpaperZip)
      } else {
        log(`Zip ${preMonthWallpaperZip} doesn't exist`)
      }
    } else {
      log(`Not 1st day of month, skip`)
    }
  } catch (error) {
    log(`Compress folder or send email failed`, error)
  }
}

compressFolderSendMail()

module.exports = {
  compressFolderSendMail,
}
