import { GetStaticPaths, GetStaticProps } from 'next';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'

import { getPrismicClient } from '../../services/prismic';
import Head from 'next/head'
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client'
import { useRouter } from 'next/router';
import { format } from 'date-fns'
import ptBr from 'date-fns/locale/pt-BR'
import addHours from 'date-fns/addHours';

import Link from 'next/link'
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: Boolean;

  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      }
    }[];

    nextPost: {
      uid: string;
      data: {
        title: string;
      }
    }[];
  }
}

export default function Post({ post, preview, navigation }: PostProps) {

  const editDate = format(
    new Date(post.last_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBr
    }
  )

  const hoursEdit = format(
    new Date(post.last_publication_date),
    'HH:MM',
    {
      locale: ptBr
    }
  )


  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item =>
      item.text.split(' ').length
    )
    words.map(words => (total += words))
    return total
  }, 0)

  const readTime = Math.ceil(totalWords / 200);

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBr
    }
  )


  return (
    <>
      <Head>
        <title>{`Posts | ${post.data.title}`}</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="Banner" className={styles.banner} />
      <main className={styles.container}>
        <div className={styles.posts}>
          <div className={styles.postsTop}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar />
                {formattedDate}
              </li>
              <li>
                <FiUser />
                {post.data.author}
              </li>
              <li>
                <FiClock />
                {`${readTime} min`}
              </li>
            </ul>
          <div className={styles.editPost}>
            <p>{`* editado ${editDate}, as ${hoursEdit}`}</p>
          </div>
          </div>
          {post.data.content.map((content) => (
            <article key={content.heading}>
              <strong>{content.heading}</strong>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
              />
            </article>
          ))}
          <section className={styles.containerNavigation}>
            {navigation?.prevPost.length > 0 && (
              <div>
               <h3>{navigation.prevPost[0].data.title.length < 20 ? navigation.prevPost[0].data.title.length : navigation.prevPost[0].data.title.substring(0, 20)+'...'}</h3>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a>Post Anterior</a>
                </Link>
              </div>
            )}

            {navigation?.nextPost.length > 0 && (
              <div>
                <h3>{navigation.nextPost[0].data.title.length < 20 ? navigation.nextPost[0].data.title.length : navigation.nextPost[0].data.title.substring(0, 20)+'...'}</h3>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a>Proximo Post</a>
                </Link>
              </div>
            )}

          </section>

          <Comments />
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.preview}>Sair do Modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ]);

  const paths = posts.results.map((post) => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  console.log(paths);

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params, preview = false, previewData }) => {
  const { slug } = params

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref || null
  });

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]'
    }
  )

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]'
    }
  )

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body]
        }
      })
    }
  }


  // console.log(JSON.stringify(post, null, 2))

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      },
      preview,
    },
    revalidate: 60 * 60 * 24
  }
};
