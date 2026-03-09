import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Comment = {
  __typename?: 'Comment';
  created_at?: Maybe<Scalars['Date']['output']>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  has_replies?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  level?: Maybe<Scalars['Int']['output']>;
  likes?: Maybe<Scalars['Int']['output']>;
  replies?: Maybe<Array<Maybe<Comment>>>;
  replies_count?: Maybe<Scalars['Int']['output']>;
  text?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type LinkedPosts = {
  __typename?: 'LinkedPosts';
  next?: Maybe<Post>;
  previous?: Maybe<Post>;
};

export type Post = {
  __typename?: 'Post';
  body?: Maybe<Scalars['String']['output']>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  comments_count?: Maybe<Scalars['Int']['output']>;
  created_at?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  is_markdown?: Maybe<Scalars['Boolean']['output']>;
  is_private?: Maybe<Scalars['Boolean']['output']>;
  is_temp?: Maybe<Scalars['Boolean']['output']>;
  last_read_at?: Maybe<Scalars['Date']['output']>;
  liked?: Maybe<Scalars['Boolean']['output']>;
  likes?: Maybe<Scalars['Int']['output']>;
  linked_posts?: Maybe<LinkedPosts>;
  meta?: Maybe<Scalars['JSON']['output']>;
  recommended_posts?: Maybe<Array<Maybe<Post>>>;
  released_at?: Maybe<Scalars['Date']['output']>;
  series?: Maybe<Series>;
  short_description?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Date']['output']>;
  url_slug?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  views?: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  post?: Maybe<Post>;
  posts?: Maybe<Array<Maybe<Post>>>;
};


export type QueryPostArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  url_slug?: InputMaybe<Scalars['String']['input']>;
  username: Scalars['String']['input'];
};


export type QueryPostsArgs = {
  cursor?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  tag?: InputMaybe<Scalars['String']['input']>;
  temp_only?: InputMaybe<Scalars['Boolean']['input']>;
  username: Scalars['String']['input'];
};

export type Series = {
  __typename?: 'Series';
  created_at?: Maybe<Scalars['Date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  posts_count?: Maybe<Scalars['Int']['output']>;
  series_posts?: Maybe<Array<Maybe<SeriesPost>>>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Date']['output']>;
  url_slug?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type SeriesPost = {
  __typename?: 'SeriesPost';
  id: Scalars['ID']['output'];
  index?: Maybe<Scalars['Int']['output']>;
  post?: Maybe<Post>;
};

export type User = {
  __typename?: 'User';
  created_at?: Maybe<Scalars['Date']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  is_certified?: Maybe<Scalars['Boolean']['output']>;
  is_followed?: Maybe<Scalars['Boolean']['output']>;
  is_trusted?: Maybe<Scalars['Boolean']['output']>;
  profile?: Maybe<UserProfile>;
  series_list?: Maybe<Array<Maybe<Series>>>;
  updated_at?: Maybe<Scalars['Date']['output']>;
  user_meta?: Maybe<UserMeta>;
  username?: Maybe<Scalars['String']['output']>;
  velog_config?: Maybe<VelogConfig>;
};

export type UserMeta = {
  __typename?: 'UserMeta';
  email_notification?: Maybe<Scalars['Boolean']['output']>;
  email_promotion?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
};

export type UserProfile = {
  __typename?: 'UserProfile';
  about?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['Date']['output']>;
  display_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  profile_links?: Maybe<Scalars['JSON']['output']>;
  short_bio?: Maybe<Scalars['String']['output']>;
  thumbnail?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['Date']['output']>;
};

export type VelogConfig = {
  __typename?: 'VelogConfig';
  id: Scalars['ID']['output'];
  logo_image?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type ReadPostQueryVariables = Exact<{
  username: Scalars['String']['input'];
  url_slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type ReadPostQuery = { __typename?: 'Query', post?: { __typename?: 'Post', id: string, title?: string | null, released_at?: any | null, updated_at?: any | null, tags?: Array<string | null> | null, body?: string | null, short_description?: string | null, is_private?: boolean | null, thumbnail?: string | null, url_slug?: string | null, user?: { __typename?: 'User', username?: string | null } | null, series?: { __typename?: 'Series', name?: string | null, url_slug?: string | null } | null, linked_posts?: { __typename?: 'LinkedPosts', previous?: { __typename?: 'Post', id: string, title?: string | null, url_slug?: string | null } | null, next?: { __typename?: 'Post', id: string, title?: string | null, url_slug?: string | null } | null } | null } | null };

export type VelogPostsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  username: Scalars['String']['input'];
  temp_only?: InputMaybe<Scalars['Boolean']['input']>;
  tag?: InputMaybe<Scalars['String']['input']>;
}>;


export type VelogPostsQuery = { __typename?: 'Query', posts?: Array<{ __typename?: 'Post', id: string, title?: string | null, url_slug?: string | null } | null> | null };


export const ReadPostDocument = gql`
    query readPost($username: String!, $url_slug: String) {
  post(username: $username, url_slug: $url_slug) {
    id
    title
    released_at
    updated_at
    tags
    body
    short_description
    is_private
    thumbnail
    url_slug
    user {
      username
    }
    series {
      name
      url_slug
    }
    linked_posts {
      previous {
        id
        title
        url_slug
      }
      next {
        id
        title
        url_slug
      }
    }
  }
}
    `;
export const VelogPostsDocument = gql`
    query velogPosts($cursor: ID, $limit: Int = 20, $username: String!, $temp_only: Boolean, $tag: String) {
  posts(
    cursor: $cursor
    limit: $limit
    username: $username
    temp_only: $temp_only
    tag: $tag
  ) {
    id
    title
    url_slug
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    readPost(variables: ReadPostQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ReadPostQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ReadPostQuery>({ document: ReadPostDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'readPost', 'query', variables);
    },
    velogPosts(variables: VelogPostsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<VelogPostsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<VelogPostsQuery>({ document: VelogPostsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'velogPosts', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;