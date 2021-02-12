import { useEffect } from 'react';
import { Helmet } from 'react-helmet';

import { normalizePosts, getPosts, sortStickyPosts } from 'lib/posts';
import { WebsiteJsonLd } from 'lib/json-ld';
import useSite from 'hooks/use-site';

import Layout from 'components/Layout';
import Header from 'components/Header';
import Section from 'components/Section';
import Container from 'components/Container';
import PostCard from 'components/PostCard';
import Pagination from 'components/Pagination';

import styles from 'styles/pages/Home.module.scss';
import { initializeApollo } from 'lib/apollo-client';
import { useQuery } from '@apollo/client';
import { QUERY_PAGINATED_POSTS } from 'data/posts';

const POST_PER_PAGE = 10;

// export default function Home({ posts }) {
export default function Home() {
  const { metadata = {} } = useSite();
  const { title, description } = metadata;

  const { data, loading, error, fetchMore } = useQuery(QUERY_PAGINATED_POSTS, {
    variables: {
      first: POST_PER_PAGE,
      after: null,
      last: null,
      before: null,
    },
  });

  const { posts, pageInfo } = normalizePosts(data);

  const updateQuery = (previousResult, { fetchMoreResult }) => {
    return fetchMoreResult.posts.edges.length ? fetchMoreResult : previousResult;
  };

  console.log('hasNextPage', pageInfo?.hasNextPage);
  console.log('hasPreviousPage', pageInfo?.hasPreviousPage);
  console.log('endCursor', pageInfo?.endCursor);
  console.log('startCursor', pageInfo?.startCursor);

  const handleNext = () => {
    fetchMore({
      variables: {
        first: POST_PER_PAGE,
        after: pageInfo.endCursor || null,
        last: null,
        before: null,
      },
      updateQuery,
    });
  };

  const handlePrev = () => {
    fetchMore({
      variables: {
        first: null,
        after: null,
        last: POST_PER_PAGE,
        before: pageInfo.startCursor || null,
      },
      updateQuery,
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error) {
    return <p>Error: {JSON.stringify(error)}</p>;
  }
  return (
    <Layout>
      <WebsiteJsonLd siteTitle={title} />
      <Header>
        <h1
          className={styles.title}
          dangerouslySetInnerHTML={{
            __html: title,
          }}
        />

        <p
          className={styles.description}
          dangerouslySetInnerHTML={{
            __html: description,
          }}
        />
      </Header>
      <Section>
        <Container>
          <h2 className="sr-only">Posts</h2>
          <ul className={styles.posts}>
            {posts.map((post) => {
              return (
                <li key={post.slug}>
                  <PostCard post={post} />
                </li>
              );
            })}
          </ul>
          <Pagination
            hasPreviousPage={pageInfo?.hasPreviousPage}
            hasNextPage={pageInfo?.hasNextPage}
            handlePrev={handlePrev}
            handleNext={handleNext}
          />
        </Container>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  // const { posts } = await getPosts( { first: 8 });
  const apolloClient = initializeApollo();

  await apolloClient.query({
    query: QUERY_PAGINATED_POSTS,
    variables: {
      first: POST_PER_PAGE,
      after: null,
      last: null,
      before: null,
    },
  });
  return {
    props: {
      // posts: sortStickyPosts(posts),
      initialApolloState: apolloClient.cache.extract(),
    },
  };
}
