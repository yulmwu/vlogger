import fs from 'fs'
import { fetchPost, fetchPosts } from './client'
import { fileWrite } from './writer'
import { BackupConfig, PostsWithData } from './types'
import { purgeS3Bucket, uploadS3 } from './aws'

export const runBackup = async (config: BackupConfig) => {
    if (config.cleanOutput && fs.existsSync(config.paths.base)) {
        fs.rmSync(config.paths.base, { recursive: true, force: true })
    }

    const posts: PostsWithData = []

    if (config.slug) {
        const data = await fetchPost(config.username, config.slug)
        if (!data) throw new Error(`Failed to fetch post ${config.slug}`)

        const resolvedSlug = data.url_slug ?? config.slug
        if (!resolvedSlug) throw new Error(`Post has no url_slug for slug ${config.slug}`)

        posts.push({
            id: data.id,
            title: data.title,
            url_slug: resolvedSlug,
            data,
        })
    } else {
        const fetched = await fetchPosts(config.username)

        for (const post of fetched) {
            if (!post) {
                console.error('Post is null or undefined, skipping...')
                continue
            }

            if (!post.url_slug) {
                console.error(`Post with ID ${post.id} has no url_slug, skipping...`)
                continue
            }

            const data = await fetchPost(config.username, post.url_slug)
            if (!data) {
                console.error(`Failed to fetch post ${post.url_slug}`)
                continue
            }

            posts.push({
                id: post.id,
                title: post.title,
                url_slug: post.url_slug,
                data,
            })
        }
    }

    await fileWrite(posts, {
        paths: config.paths,
        includeImages: config.includeImages,
        includeMetadata: config.includeMetadata,
        includeJson: config.includeJson,
        includeDatePrefix: config.includeDatePrefix,
        cdnBaseUrl: config.cdnBaseUrl,
        cacheDir: config.cacheDir,
    })

    console.log(`Fetched ${posts.length} posts`)
    if (config.slug) console.log(`slug: ${config.slug}`)

    if (config.s3.upload) {
        if (!config.s3.bucket) throw new Error('S3 bucket is not set')

        await uploadS3(config.paths.base, config.s3.bucket)
        await purgeS3Bucket(config.s3.bucket, config.s3.retain)
    }
}
