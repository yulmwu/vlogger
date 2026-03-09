import { getSdk, Post } from './generated/graphql'
import { GraphQLClient } from 'graphql-request'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

export const client = new GraphQLClient('https://v2.velog.io/graphql', {
    headers: {
        Authorization: `Bearer ${process.env.VELOG_JWT_ACCESS_TOKEN}`,
    },
})

export const sdk = getSdk(client)

const LIMIT = 20

export const fetchPosts = async (username: string, cursor?: string, posts: Post[] = []): Promise<Post[]> => {
    const data = await sdk.velogPosts({
        cursor,
        limit: LIMIT,
        username,
    })

    if (data.posts && data.posts.length > 0) {
        posts.push(...data.posts.filter((post): post is Post => post !== null))

        if (data.posts.length < LIMIT) return posts

        const nextCursor = data.posts[data.posts.length - 1]?.id
        if (nextCursor) await fetchPosts(username, nextCursor, posts)
    }

    return posts
}

export const fetchPost = async (username: string, urlSlug: string): Promise<Post> => {
    const data = await sdk.readPost({
        username,
        url_slug: urlSlug,
    })

    return data.post as Post
}
