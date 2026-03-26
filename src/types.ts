import { Post } from './generated/graphql'

export interface PostWithData extends Post {
    data: Post
}

export type PostsWithData = PostWithData[]

export interface Paths {
    base: string
    posts: string
    images: string
    thumbnails: string
}

export interface BackupConfig {
    username: string
    slug?: string
    outputDir: string
    paths: Paths
    includeImages: boolean
    includeMetadata: boolean
    includeJson: boolean
    includeDatePrefix: boolean
    cdnBaseUrl?: string | null
    cdnThumbnailSuffix: string
    cleanOutput: boolean
    cacheDir: string
    s3: {
        upload: boolean
        bucket?: string
        retain: number
    }
}

export interface FileWriterOptions {
    paths: Paths
    includeImages: boolean
    includeMetadata: boolean
    includeJson: boolean
    appendJson?: boolean
    includeDatePrefix: boolean
    cdnBaseUrl?: string | null
    cdnThumbnailSuffix: string
    cacheDir: string
}
