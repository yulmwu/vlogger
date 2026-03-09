#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

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

function extractMarkdownImageLinks(content) {
    const links = []
    const re = /!\[[^\]]*\]\(([^)]+)\)/g
    let match

    while ((match = re.exec(content)) !== null) {
        const raw = match[1].trim()
        const firstToken = raw.split(/\s+/)[0]
        const cleaned = firstToken.replace(/^<|>$/g, '').replace(/^['"]|['"]$/g, '')
        if (cleaned) links.push(cleaned)
    }

    return links
}

function extractHtmlImageLinks(content) {
    const links = []
    const re = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi
    let match

    while ((match = re.exec(content)) !== null) {
        const cleaned = match[1].trim()
        if (cleaned) links.push(cleaned)
    }

    return links
}

function isRemote(link) {
    return /^https?:\/\//i.test(link) || /^data:/i.test(link)
}

function main() {
    const args = process.argv.slice(2)
    const backupArgIndex = args.indexOf('--backup')
    const backupDir = backupArgIndex !== -1 && args[backupArgIndex + 1] ? path.resolve(args[backupArgIndex + 1]) : path.resolve(process.cwd(), 'backup')

    const postsDir = path.join(backupDir, 'posts')
    if (!isDir(postsDir)) {
        console.error(`Missing posts dir: ${postsDir}`)
        process.exit(1)
    }

    const categoryDirs = listDirs(postsDir)
    const missing = []

    for (const categoryPath of categoryDirs) {
        const mdFiles = listFiles(categoryPath).filter((p) => p.endsWith('.md'))
        for (const filePath of mdFiles) {
            const content = fs.readFileSync(filePath, 'utf8')
            const links = [...extractMarkdownImageLinks(content), ...extractHtmlImageLinks(content)]

            for (const link of links) {
                if (isRemote(link)) continue
                const resolved = path.resolve(path.dirname(filePath), link)
                if (!fs.existsSync(resolved)) {
                    missing.push({
                        markdown: filePath,
                        link,
                        resolved,
                    })
                }
            }
        }
    }

    if (missing.length === 0) {
        console.log('All local image links exist.')
        return
    }

    for (const item of missing) {
        console.log(`Missing: ${item.link}`)
        console.log(`  in: ${item.markdown}`)
        console.log(`  resolved: ${item.resolved}`)
    }

    console.log(`Total missing images: ${missing.length}`)
    process.exit(1)
}

main()
