import path from 'path'
import fs from 'fs'
import { FileWriterOptions, PostsWithData } from './types'
import { Post } from './generated/graphql'
import axios from 'axios'

const REGEX_IMAGE_URL = /!\[([^\]]*)\]\(([^)]+)\)/g
const REGEX_IMAGE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const IMAGE_DIR_NAME = 'images'
const THUMBNAIL_DIR_NAME = 'thumbnails'

const whiteSpaceReplace = (str: string): string => str.replace(/\s+/g, '-').toLowerCase()
const dateFormat = (date: string): string => new Date(date).toISOString().split('T')[0]
const formatPostSlug = (date: string, slug: string, includeDatePrefix: boolean): string => (includeDatePrefix ? `${date}-${slug}` : slug)

const findCachedImage = (cacheDir: string, imageUuid: string, imageExt: string): string | null => {
    if (!fs.existsSync(cacheDir)) return null

    const backupDirs = fs.readdirSync(cacheDir).filter((dir) => {
        return fs.statSync(path.join(cacheDir, dir)).isDirectory()
    })

    for (const backupDir of backupDirs) {
        const imagesPath = path.join(cacheDir, backupDir, IMAGE_DIR_NAME)
        if (!fs.existsSync(imagesPath)) continue

        const findImageRecursive = (dir: string): string | null => {
            const entries = fs.readdirSync(dir)

            for (const entry of entries) {
                const fullPath = path.join(dir, entry)
                const stat = fs.statSync(fullPath)

                if (stat.isDirectory()) {
                    const result = findImageRecursive(fullPath)
                    if (result) return result
                } else if (entry === `${imageUuid}${imageExt}`) {
                    return fullPath
                }
            }

            return null
        }

        const cachedImagePath = findImageRecursive(imagesPath)
        if (cachedImagePath) {
            console.log(`Found cached image: ${cachedImagePath}`)
            return cachedImagePath
        }
    }

    return null
}

const imageToCdn = (post: Post, cdnBaseUrl?: string | null): Post => {
    if (!post.body) return post
    if (!cdnBaseUrl) return post

    const matches = [...post.body.matchAll(REGEX_IMAGE_URL)]

    for (const match of matches) {
        const altText = match[1]
        const imageUrl = match[2]

        const imageUuidMatch = imageUrl.match(REGEX_IMAGE_UUID)
        if (!imageUuidMatch) continue

        const imageUuid = imageUuidMatch[0]
        const imageExt = path.extname(imageUrl)
        const cdnUrl = `${cdnBaseUrl}/${imageUuid}${imageExt}`

        post.body = post.body.replace(match[0], `![${altText}](${cdnUrl})`)
    }

    return post
}

const imageDownload = async (url: string, destPath: string, cacheDir: string, imageUuid?: string, silent: boolean = false) => {
    if (fs.existsSync(destPath)) {
        if (!silent) console.log(`Image already exists at ${destPath}, skipping download`)
        return
    }

    if (imageUuid) {
        const imageExt = path.extname(destPath)
        const cachedImagePath = findCachedImage(cacheDir, imageUuid, imageExt)

        if (cachedImagePath) {
            if (!silent) console.log(`Copying cached image from ${cachedImagePath} to ${destPath}`)
            fs.copyFileSync(cachedImagePath, destPath)
            return
        }
    }

    if (!silent) console.log(`Downloading image from ${url}, saving to ${destPath}`)
    const response = await axios.get(url, { responseType: 'stream' })
    const writer = fs.createWriteStream(destPath)

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(true))
        writer.on('error', (err: Error) => {
            console.error(`Error saving image: ${err.message}`)
            reject(err)
        })
    })
}

export const imageExtract = async (post: Post, options: FileWriterOptions): Promise<Post> => {
    if (!post.body) return post

    const matches = [...post.body.matchAll(REGEX_IMAGE_URL)]

    for (const match of matches) {
        const altText = match[1]
        const imageUrl = match[2]
        const imageExt = path.extname(imageUrl)

        const imageUuidMatch = imageUrl.match(REGEX_IMAGE_UUID)
        if (!imageUuidMatch) {
            console.error(`Failed to extract image UUID from URL: ${imageUrl}`)
            continue
        }

        const imageUuid = imageUuidMatch[0]

        const formattedDate = dateFormat(post.released_at)
        const postSlug = whiteSpaceReplace(post.url_slug!)
        const postFileSlug = formatPostSlug(formattedDate, postSlug, options.includeDatePrefix)

        const seriesName = post.series ? whiteSpaceReplace(post.series.name!) : null
        const seriesPath = seriesName ? path.join(options.paths.images, seriesName) : options.paths.images

        const postPath = path.join(seriesPath, postFileSlug)

        post.body = post.body.replace(match[0], seriesName ? `![${altText}](../../${IMAGE_DIR_NAME}/${seriesName}/${postFileSlug}/${imageUuid}${imageExt})` : `![${altText}](../${IMAGE_DIR_NAME}/${postFileSlug}/${imageUuid}${imageExt})`)

        fs.mkdirSync(postPath, { recursive: true })

        const imagePath = path.join(postPath, `${imageUuid}${imageExt}`)
        await imageDownload(imageUrl, imagePath, options.cacheDir, imageUuid)
    }

    return post
}

const thumbnailExtract = async (post: Post, options: FileWriterOptions): Promise<string | null> => {
    if (!post.thumbnail) return null
    const thumbnailExt = path.extname(post.thumbnail)

    const thumbnailPath = post.series
        ? path.join(options.paths.thumbnails, whiteSpaceReplace(post.series.name!), `${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}`)
        : path.join(options.paths.thumbnails, `${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}`)

    fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true })
    await imageDownload(post.thumbnail, thumbnailPath, options.cacheDir, undefined, true)

    return post.series ? `../../${THUMBNAIL_DIR_NAME}/${whiteSpaceReplace(post.series.name!)}/${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}` : `../${THUMBNAIL_DIR_NAME}/${whiteSpaceReplace(post.url_slug!)}${thumbnailExt}`
}

/*
---
title: Example Post (.title)
description: This is an example post for testing. (.short_description)
slug: 2024-01-01-example-post (date+.url_slug)
author: Author Name (.user.username)
date: 2022-09-26 20:38:00 +0900 (.released_at)
updated_at: 2022-09-26 20:38:00 +0900 (.updated_at)
categories: ["Series Name"] (.series.name) 
tags: ["tag1", "tag2"] (.tags)
series:
  name: Series Name (.series.name)
  slug: series-name (.series.url_slug)
thumbnail: https://example.com/thumbnail.png (.thumbnail)
linked_posts:
  previous: 2024-01-01-url_slug_of_previous_post (.linked_posts.previous)
  next: 2024-01-01-url_slug_of_next_post (.linked_posts.next)
is_private: false (.is_private)
---

body
*/

export const fileWrite = async (posts: PostsWithData, options: FileWriterOptions) => {
    if (options.includeJson) {
        if (!fs.existsSync(options.paths.base)) {
            fs.mkdirSync(options.paths.base, { recursive: true })
        }

        const jsonPath = path.join(options.paths.base, '_output.json')
        if (options.appendJson && fs.existsSync(jsonPath)) {
            let existing: PostsWithData = []
            try {
                const raw = fs.readFileSync(jsonPath, 'utf-8')
                const parsed = JSON.parse(raw)
                if (Array.isArray(parsed)) existing = parsed
            } catch {
                existing = []
            }

            const keyOf = (p: any): string | null => {
                if (p && typeof p === 'object') {
                    if (typeof p.id === 'string' && p.id.length > 0) return `id:${p.id}`
                    if (typeof p.url_slug === 'string' && p.url_slug.length > 0) return `slug:${p.url_slug}`
                }

                return null
            }

            const incomingByKey = new Map<string, PostsWithData[number]>()
            for (const post of posts) {
                const key = keyOf(post)
                if (key) incomingByKey.set(key, post)
            }

            const merged: PostsWithData = []
            const used = new Set<string>()

            for (const post of existing) {
                const key = keyOf(post)
                if (key && incomingByKey.has(key)) {
                    merged.push(incomingByKey.get(key)!)
                    used.add(key)
                } else {
                    merged.push(post)
                }
            }

            for (const [key, post] of incomingByKey.entries()) {
                if (!used.has(key)) merged.push(post)
            }

            fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 4), 'utf-8')
        } else {
            fs.writeFileSync(jsonPath, JSON.stringify(posts, null, 4), 'utf-8')
        }
    }

    for (const post of posts) {
        if (!post.data) {
            console.error(`Post ${post.url_slug} has no data, skipping...`)
            continue
        }

        if (options.includeImages) {
            post.data = await imageExtract(post.data, options)
        } else {
            post.data = imageToCdn(post.data, options.cdnBaseUrl)
        }

        const formattedDate = dateFormat(post.data.released_at)
        const postSlug = whiteSpaceReplace(post.url_slug!)
        const postFileSlug = formatPostSlug(formattedDate, postSlug, options.includeDatePrefix)

        if (options.includeMetadata) {
            const thumbnailPath = await thumbnailExtract(post.data, options)
            const metadata = `
---
title: "${post.data.title}"
description: "${post.data.short_description ?? 'No description provided'}"
slug: "${postFileSlug}"
author: ${post.data.user!.username ?? 'Unknown Author'}
date: ${post.data.released_at}
updated_at: ${post.data.updated_at}
categories: ${post.data.series ? `["${post.data.series.name}"]` : '[]'}
tags: ${post.data.tags && post.data.tags.length > 0 ? `["${post.data.tags.join('", "')}"]` : '[]'}${
                post.data.series ? `\nseries:\n  name: ${post.data.series ? post.data.series.name : ''}\n  slug: ${post.data.series ? whiteSpaceReplace(post.data.series.url_slug!) : ''}` : ''
            }${thumbnailPath ? `\nthumbnail: ${thumbnailPath}` : ''}
linked_posts:
  previous: ${post.data.linked_posts?.previous ? formatPostSlug(formattedDate, whiteSpaceReplace(post.data.linked_posts.previous.url_slug!), options.includeDatePrefix) : ''}
  next: ${post.data.linked_posts?.next ? formatPostSlug(formattedDate, whiteSpaceReplace(post.data.linked_posts.next.url_slug!), options.includeDatePrefix) : ''}
is_private: ${post.data.is_private}
---
`.trim()

            post.data.body = metadata + '\n\n' + (post.data.body ?? '')
        }

        const postPath = path.join(options.paths.posts, post.data.series ? whiteSpaceReplace(post.data.series.name!) : '', `${postFileSlug}.md`)
        fs.mkdirSync(path.dirname(postPath), { recursive: true })
        fs.writeFileSync(postPath, post.data.body!, 'utf-8')
    }
}
