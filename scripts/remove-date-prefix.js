#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2}-)(.+)$/

function isDir(p) {
    try {
        return fs.statSync(p).isDirectory()
    } catch {
        return false
    }
}

function isFile(p) {
    try {
        return fs.statSync(p).isFile()
    } catch {
        return false
    }
}

function listDirs(p) {
    if (!isDir(p)) return []
    return fs
        .readdirSync(p)
        .map((name) => path.join(p, name))
        .filter(isDir)
}

function listFiles(p) {
    if (!isDir(p)) return []
    return fs
        .readdirSync(p)
        .map((name) => path.join(p, name))
        .filter(isFile)
}

function removeDatePrefix(name) {
    const m = DATE_PREFIX_RE.exec(name)
    if (!m) return null
    return m[2]
}

function safeRename(from, to) {
    if (from === to) return false
    if (fs.existsSync(to)) {
        throw new Error(`Target already exists: ${to}`)
    }
    fs.renameSync(from, to)
    return true
}

function readText(p) {
    return fs.readFileSync(p, 'utf8')
}

function writeText(p, content) {
    fs.writeFileSync(p, content, 'utf8')
}

function updateLinkedPosts(content, map) {
    // Only replace values on lines like "  previous: xxx" / "  next: xxx"
    return content.replace(/^(\s+)(previous|next):\s*([A-Za-z0-9-_.]+)\s*$/gm, (line, ws, key, value) => {
        const replacement = map.get(value)
        if (!replacement) return line
        return `${ws}${key}: ${replacement}`
    })
}

function updateImagePaths(content, category, map) {
    // Replace /images/<category>/<old>/ with /images/<category>/<new>/
    for (const [oldBase, newBase] of map.entries()) {
        const oldSeg = `/images/${category}/${oldBase}/`
        const newSeg = `/images/${category}/${newBase}/`
        if (content.includes(oldSeg)) {
            content = content.split(oldSeg).join(newSeg)
        }
    }
    return content
}

function updateThumbnailPaths(content, category, map) {
    // Replace /thumbnails/<category>/<old> with /thumbnails/<category>/<new>
    for (const [oldBase, newBase] of map.entries()) {
        const oldSeg = `/thumbnails/${category}/${oldBase}`
        const newSeg = `/thumbnails/${category}/${newBase}`
        if (content.includes(oldSeg)) {
            content = content.split(oldSeg).join(newSeg)
        }
    }
    return content
}

function main() {
    const args = process.argv.slice(2)
    const backupArgIndex = args.indexOf('--backup')
    const backupDir = backupArgIndex !== -1 && args[backupArgIndex + 1] ? path.resolve(args[backupArgIndex + 1]) : path.resolve(process.cwd(), 'backup')

    const postsDir = path.join(backupDir, 'posts')
    const imagesDir = path.join(backupDir, 'images')
    const thumbnailsDir = path.join(backupDir, 'thumbnails')

    if (!isDir(postsDir)) {
        console.error(`Missing posts dir: ${postsDir}`)
        process.exit(1)
    }

    const categoryDirs = listDirs(postsDir)
    let renamedFiles = 0
    let renamedDirs = 0
    let updatedFiles = 0

    for (const categoryPath of categoryDirs) {
        const category = path.basename(categoryPath)
        const mdFiles = listFiles(categoryPath).filter((p) => p.endsWith('.md'))

        const renameMap = new Map()
        for (const filePath of mdFiles) {
            const base = path.basename(filePath, '.md')
            const newBase = removeDatePrefix(base)
            if (newBase) {
                renameMap.set(base, newBase)
            }
        }

        // Rename markdown files
        for (const [oldBase, newBase] of renameMap.entries()) {
            const from = path.join(categoryPath, `${oldBase}.md`)
            const to = path.join(categoryPath, `${newBase}.md`)
            if (safeRename(from, to)) renamedFiles += 1
        }

        // Rename images subdirs
        const imagesCategory = path.join(imagesDir, category)
        if (isDir(imagesCategory)) {
            const imageSubdirs = listDirs(imagesCategory)
            for (const imgDir of imageSubdirs) {
                const oldBase = path.basename(imgDir)
                const newBase = renameMap.get(oldBase)
                if (!newBase) continue
                const to = path.join(imagesCategory, newBase)
                if (safeRename(imgDir, to)) renamedDirs += 1
            }
        }

        // Rename thumbnails that still have date prefix
        const thumbsCategory = path.join(thumbnailsDir, category)
        if (isDir(thumbsCategory)) {
            const thumbFiles = listFiles(thumbsCategory)
            for (const thumbPath of thumbFiles) {
                const ext = path.extname(thumbPath)
                const base = path.basename(thumbPath, ext)
                const newBase = renameMap.get(base)
                if (!newBase) continue
                const to = path.join(thumbsCategory, `${newBase}${ext}`)
                if (safeRename(thumbPath, to)) renamedFiles += 1
            }
        }

        // Update markdown references
        const updatedMdFiles = listFiles(categoryPath).filter((p) => p.endsWith('.md'))
        for (const filePath of updatedMdFiles) {
            let content = readText(filePath)
            const before = content
            content = updateLinkedPosts(content, renameMap)
            content = updateImagePaths(content, category, renameMap)
            content = updateThumbnailPaths(content, category, renameMap)
            if (content !== before) {
                writeText(filePath, content)
                updatedFiles += 1
            }
        }
    }

    console.log(`Done. Renamed files: ${renamedFiles}, renamed dirs: ${renamedDirs}, updated markdown: ${updatedFiles}`)
}

main()
