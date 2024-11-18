import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
        <Head>
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="manifest" href="/site.webmanifest" />
            <link
                rel="icon"
                type="image/png"
                sizes="192x192"
                href="/android-chrome-192x192.png"
            />
            <link
                rel="icon"
                type="image/png"
                sizes="512x512"
                href="/android-chrome-512x512.png"
            />
        </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
