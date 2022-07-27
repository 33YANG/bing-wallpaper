'use strict'

const fs = require('fs')
const fsp = require('fs').promises
const archiver = require('archiver')
const nodemailer = require('nodemailer')
const { BING_URL_PREFIX, EMAIL_FROM_USER, EMAIL_FROM_EMAIL, EMAIL_FROM_PASS, EMAIL_ADDRESS_LIST, resolvePath, getLatestWallpaper } = require('./util')

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
      console.log(`[ ${new Date().toLocaleString()} ] Error while archiving:`, err)
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
 *
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

  const curDate = `${new Date().getFullYear()}-${new Date().getMonth()}`
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
      console.log(`[ ${new Date().toLocaleString()} ] Error while sending mail: `, error)
    } else {
      console.log(`[ ${new Date().toLocaleString()} ] Mail sent to ${EMAIL_ADDRESS_LIST.join(', ')} done:`, info.response)
    }
  })
}

async function compressFolderSendMail() {
  try {
    const curDay = new Date().getDate()
    // per 1st day of month handle send wallpaper
    if (curDay === 1 || true) {
      // handle previous month data, compress to zip and remove folder
      const preMonthWallpaperDir = resolvePath(`../wallpaper/${new Date().getFullYear()}-${new Date().getMonth()}`)
      const preMonthWallpaperZip = resolvePath(`${preMonthWallpaperDir}.zip`)
      console.log(`[ ${new Date().toLocaleString()} ] Compressing ${preMonthWallpaperDir} to ${preMonthWallpaperZip}`)

      if (fs.existsSync(preMonthWallpaperDir)) {
        await zipDirectory(preMonthWallpaperDir, preMonthWallpaperZip)

        await fsp.rm(preMonthWallpaperDir, { recursive: true })
        console.log(`[ ${new Date().toLocaleString()} ] Remove ${preMonthWallpaperDir} successfully`)

        // delete previous previous month wallpaper zip if exists
        const prePreMonthWallpaperZip = resolvePath(`../wallpaper/${new Date().getFullYear()}-${new Date().getMonth() - 1}.zip`)
        if (fs.existsSync(prePreMonthWallpaperZip)) {
          await fsp.rm(prePreMonthWallpaperZip)
          console.log(`[ ${new Date().toLocaleString()} ] Delete ${prePreMonthWallpaperZip} success`)
        }
      } else {
        console.log(`[ ${new Date().toLocaleString()} ] Folder ${preMonthWallpaperDir} doesn't exist`)
      }

      if (fs.existsSync(preMonthWallpaperZip)) {
        console.log(`[ ${new Date().toLocaleString()} ] Sending mail ${preMonthWallpaperZip}`)
        await sendMail(preMonthWallpaperZip)
      } else {
        console.log(`[ ${new Date().toLocaleString()} ] Zip ${preMonthWallpaperZip} doesn't exist`)
      }
    } else {
      console.log(`[ ${new Date().toLocaleString()} ] Not 1st day of month, skip`)
    }
  } catch (error) {
    console.log(`[ ${new Date().toLocaleString()} ] Compress folder or send email failed`, error)
  }
}

compressFolderSendMail()

module.exports = {
  compressFolderSendMail,
}
