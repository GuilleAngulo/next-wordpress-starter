import { getApolloClient } from 'lib/apollo-client';

import { updateUserAvatar } from 'lib/users';
import { sortObjectsByDate } from 'lib/datetime';

import {
  QUERY_ALL_POSTS,
  getQueryPostBySlug,
  getQueryPostsByAuthorSlug,
  getQueryPostsByCategoryId,
  getPaginatedPosts,
  QUERY_PAGINATED_POSTS,
} from 'data/posts';

/**
 * postPathBySlug
 */

export function postPathBySlug(slug) {
  return `/posts/${slug}`;
}

/**
 * getPostBySlug
 */

export async function getPostBySlug(slug) {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: getQueryPostBySlug(slug),
  });

  const post = data?.data.postBy;

  return {
    post: [post].map(mapPostData)[0],
  };
}

/**
 * getAllPosts
 */

export async function getAllPosts(options) {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: QUERY_ALL_POSTS,
  });

  const posts = data?.data.posts.edges.map(({ node = {} }) => node);

  return {
    posts: Array.isArray(posts) && posts.map(mapPostData),
  };
}

/**
 * getPosts
 */

export async function getPosts(options) {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: QUERY_PAGINATED_POSTS,
    options,
  });

  const posts = data.posts.edges.map(({ node = {} }) => node);

  return {
    posts: Array.isArray(posts) && posts.map(mapPostData),
  };
}

/**
 * normalizePosts
 */
export function normalizePosts(data) {
  const posts = data?.posts?.edges.map(({ node = {} }) => node);
  const pageInfo = data?.posts?.pageInfo;

  return {
    posts: Array.isArray(posts) && posts.map(mapPostData),
    pageInfo,
  };
}

/**
 * sortStickyPosts
 */
export function sortStickyPosts(posts = []) {
  return [...posts].sort((post) => (post.isSticky ? -1 : 1));
}

/**
 * getPostsByAuthorSlug
 */

export async function getPostsByAuthorSlug(slug) {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: getQueryPostsByAuthorSlug(slug),
  });

  const posts = data?.data.posts.edges.map(({ node = {} }) => node);

  return {
    posts: Array.isArray(posts) && posts.map(mapPostData),
  };
}

/**
 * getPostsByCategoryId
 */

export async function getPostsByCategoryId(categoryId) {
  const apolloClient = getApolloClient();

  const data = await apolloClient.query({
    query: getQueryPostsByCategoryId(categoryId),
  });

  const posts = data?.data.posts.edges.map(({ node = {} }) => node);

  return {
    posts: Array.isArray(posts) && posts.map(mapPostData),
  };
}

/**
 * getRecentPosts
 */

export async function getRecentPosts({ count }) {
  const { posts } = await getAllPosts();
  const sorted = sortObjectsByDate(posts);
  return {
    posts: sorted.slice(0, count),
  };
}

/**
 * sanitizeExcerpt
 */

export function sanitizeExcerpt(excerpt) {
  if (typeof excerpt !== 'string') {
    throw new Error(`Failed to sanitize excerpt: invalid type ${typeof excerpt}`);
  }

  let sanitized = excerpt;

  sanitized = sanitized.replace(/\s?\[\&hellip\;\]/, '...');
  sanitized = sanitized.replace('....', '...');

  return sanitized;
}

/**
 * mapPostData
 */

export function mapPostData(post = {}) {
  const data = { ...post };

  // Clean up the author object to avoid someone having to look an extra
  // level deeper into the node

  if (data.author) {
    data.author = {
      ...data.author.node,
    };
  }

  // The URL by default that comes from Gravatar / WordPress is not a secure
  // URL. This ends up redirecting to https, but it gives mixed content warnings
  // as the HTML shows it as http. Replace the url to avoid those warnings
  // and provide a secure URL by default

  if (data.author?.avatar) {
    data.author.avatar = updateUserAvatar(data.author.avatar);
  }

  // Clean up the categories to make them more easy to access

  if (data.categories) {
    data.categories = data.categories.edges.map(({ node }) => {
      return {
        ...node,
      };
    });
  }

  // Clean up the featured image to make them more easy to access

  if (data.featuredImage) {
    data.featuredImage = data.featuredImage.node;
  }

  return data;
}

/**
 * getRelatedPosts
 */

export async function getRelatedPosts(category, postId, count = 5) {
  let relatedPosts = [];

  if (!!category) {
    const { posts } = await getPostsByCategoryId(category.categoryId);
    const filtered = posts.filter(({ postId: id }) => id !== postId);
    const sorted = sortObjectsByDate(filtered);
    relatedPosts = sorted.map((post) => ({ title: post.title, slug: post.slug }));
  }

  if (relatedPosts.length > count) {
    return relatedPosts.slice(0, count);
  }
  return relatedPosts;
}
