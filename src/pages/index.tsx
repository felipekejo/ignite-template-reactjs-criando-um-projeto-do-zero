import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>(postsPagination);

  function handleLoadMorePost(): void {
    async function loadMorePosts(): Promise<void> {
      try {
        const fetchResponse = await fetch(posts.next_page);
        console.log(fetchResponse);
        const fetchData = await fetchResponse.json();
        console.log(fetchData);

        const formattedFetchData = fetchData.results.map(post => {
          return {
            ...post,
          };
        });
        console.log(formattedFetchData);

        const newPostStateData = {
          next_page: fetchData.next_page,
          results: [...posts.results, ...formattedFetchData],
        };

        setPosts(newPostStateData);
      } catch (err) {
        console.info('No more posts to load.', err);
      }
    }

    loadMorePosts();
  }
  return (
    <main className={commonStyles.container}>
      <div className={styles.post}>
        {posts.results.map(post => (
          <Link href={`/post/${post.uid}`}>
            <a key={post.uid}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <div>
                  <FiCalendar />
                  <span style={{ textTransform: 'capitalize' }}>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      { locale: ptBR }
                    )}
                  </span>
                </div>
                <div>
                  <FiUser />
                  <span>{post.data.author}</span>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {posts.next_page && (
        <button
          type="button"
          className={styles.button}
          onClick={handleLoadMorePost}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'po')],
    {
      fetch: ['po.title', 'po.subtitle', 'po.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
