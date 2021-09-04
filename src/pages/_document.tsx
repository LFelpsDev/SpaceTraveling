import Document, { Head, Html, NextScript, Main } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script async defer src="https://static.cdn.prismic.io/prismic.js?new=true&repo=aplication-of-zero"></script>
        </body>
      </Html>
    )
  }
}
