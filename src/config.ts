import path from 'path'
import process from 'process'
import { BackupConfig } from './types'
import { CliOptions } from './cli'

const DEFAULT_USERNAME = 'yulmwu'
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'backup')
const DEFAULT_CACHE_DIR = path.join(process.cwd(), 'OLD')
const DEFAULT_S3_RETAIN = 5
const DEFAULT_CDN_THUMBNAIL_SUFFIX = '_960x540'

export const resolveConfig = (cli: CliOptions): BackupConfig => {
    const username = cli.username ?? process.env.VELOG_USERNAME ?? DEFAULT_USERNAME
    const outputDir = cli.output ?? process.env.VELOG_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR
    const includeImages = cli.images ?? true
    const includeMetadata = cli.metadata ?? true
    const includeJson = cli.json ?? true
    const includeDatePrefix = cli.datePrefix ?? true
    const cdnBaseUrl = cli.cdnBaseUrl ?? process.env.CDN_BASE_URL ?? null
    const cdnThumbnailSuffix = cli.cdnThumbnailSuffix ?? process.env.CDN_THUMBNAIL_SUFFIX ?? DEFAULT_CDN_THUMBNAIL_SUFFIX
    const cleanOutput = cli.clean ?? true
    const cacheDir = process.env.VELOG_CACHE_DIR ?? DEFAULT_CACHE_DIR

    const s3Upload = cli.s3Upload ?? false
    const s3Bucket = cli.s3Bucket ?? process.env.AWS_S3_BUCKET_NAME
    const s3Retain = cli.s3Retain ?? DEFAULT_S3_RETAIN

    return {
        username,
        slug: cli.slug,
        outputDir,
        paths: {
            base: outputDir,
            posts: path.join(outputDir, 'posts'),
            images: path.join(outputDir, 'images'),
            thumbnails: path.join(outputDir, 'thumbnails'),
        },
        includeImages,
        includeMetadata,
        includeJson,
        includeDatePrefix,
        cdnBaseUrl,
        cdnThumbnailSuffix,
        cleanOutput,
        cacheDir,
        s3: {
            upload: s3Upload,
            bucket: s3Bucket,
            retain: s3Retain,
        },
    }
}

export const validateConfig = (config: BackupConfig): string[] => {
    const errors: string[] = []

    if (!config.username) errors.push('Missing username. Use --username or VELOG_USERNAME.')

    if (config.s3.upload && !config.s3.bucket) {
        errors.push('S3 upload enabled but no bucket set. Use --s3-bucket or AWS_S3_BUCKET_NAME.')
    }

    return errors
}
