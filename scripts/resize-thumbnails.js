#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const SUPPORTED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

function isDir(p) {
    try {
        return fs.statSync(p).isDirectory()
    } catch {
        return false
    }
}

function listAllFiles(dir) {
    const results = []
    if (!isDir(dir)) return results
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            results.push(...listAllFiles(full))
        } else if (entry.isFile()) {
            results.push(full)
        }
    }

    return results
}

function parseSize(arg) {
    const m = /^(\d+)x(\d+)$/.exec(arg || '')
    if (!m) return null
    return { width: Number(m[1]), height: Number(m[2]) }
}

function isSixteenNine({ width, height }) {
    return width * 9 === height * 16
}

function buildOutputPath(filePath, sizeLabel) {
    const dir = path.dirname(filePath)
    const ext = path.extname(filePath)
    const base = path.basename(filePath, ext)
    return path.join(dir, `${base}_${sizeLabel}${ext}`)
}

async function resizeImage(inputPath, outputPath, width, height) {
    const ext = path.extname(inputPath).toLowerCase()
    const image = sharp(inputPath).resize(width, height, {
        fit: 'cover',
        position: 'centre',
    })

    if (ext === '.png') {
        await image.png().toFile(outputPath)
        return
    }

    if (ext === '.jpg' || ext === '.jpeg') {
        await image.jpeg({ quality: 90 }).toFile(outputPath)
        return
    }

    if (ext === '.webp') {
        await image.webp({ quality: 90 }).toFile(outputPath)
        return
    }

    await image.toFile(outputPath)
}

async function main() {
    const args = process.argv.slice(2)
    const backupArgIndex = args.indexOf('--backup')
    const sizeArgIndex = args.indexOf('--size')

    const backupDir = backupArgIndex !== -1 && args[backupArgIndex + 1] ? path.resolve(args[backupArgIndex + 1]) : path.resolve(process.cwd(), 'backup')

    const sizeArg = sizeArgIndex !== -1 ? args[sizeArgIndex + 1] : '960x540'
    const size = parseSize(sizeArg) || { width: 960, height: 540 }

    if (!isSixteenNine(size)) {
        console.error(`Invalid size (must be 16:9): ${size.width}x${size.height}`)
        process.exit(1)
    }

    const sizeLabel = `${size.width}x${size.height}`
    const thumbnailsDir = path.join(backupDir, 'thumbnails')
    if (!isDir(thumbnailsDir)) {
        console.error(`Missing thumbnails dir: ${thumbnailsDir}`)
        process.exit(1)
    }

    const files = listAllFiles(thumbnailsDir).filter((p) => SUPPORTED_EXTS.has(path.extname(p).toLowerCase()))
    if (files.length === 0) {
        console.log('No thumbnails found.')
        return
    }

    let processed = 0
    for (const filePath of files) {
        const outputPath = buildOutputPath(filePath, sizeLabel)
        await resizeImage(filePath, outputPath, size.width, size.height)
        processed += 1
    }

    console.log(`Done. Created ${processed} thumbnails with suffix _${sizeLabel}.`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
