import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  function getReadingTime(): number {
    const regexPattern = /[^\w]/;
    const totalWords = post.data.content.reduce((acc, item) => {
      const totalHeadingWords = item.heading?.split(regexPattern).length ?? 0;
      const totalBodyWords = item.body.reduce((bodyAcc, bodyItem) => {
        return bodyAcc + bodyItem.text.split(regexPattern).length;
      }, 0);
      return acc + totalHeadingWords + totalBodyWords;
    }, 0);
    return Math.round(totalWords / 200);
  }

  return (
    <main className={commonStyles.container}>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>
      <div className={styles.post}>
        <h1>{post.data.title}</h1>
        <div className={styles.info}>
          <div>
            <FiCalendar />
            <span>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
          </div>
          <div>
            <FiUser />
            <span>{post.data.author}</span>
          </div>
          <div>
            <FiClock />
            <span>{getReadingTime()} min</span>
          </div>
        </div>
        <div>
          {post.data.content.map(content => {
            return (
              <>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'po')],
    {
      fetch: ['po.uid'],
      pageSize: 100,
    }
  );
  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('po', String(slug), {});

  // const post = {
  //   slug: response.uid,
  //   first_publication_date: response.first_publication_date,
  //   data: {
  //     title: response.data.title,
  //     subtitle: response.data.subtitle,
  //     banner: {
  //       url: response.data.banner.url,
  //     },
  //     author: response.data.author,
  //     content: response.data.content.map(content => {
  //       return {
  //         body: [...content.body],
  //         heading: content.heading,
  //       };
  //     }),
  //   },
  // };
  // console.log(JSON.stringify(post));

  return {
    props: {
      post: response,
    },
    revalidate: 60,
  };
};
