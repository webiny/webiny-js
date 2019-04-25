import React from 'react';

const Html = ({ content, helmet, assets, state }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#000000" />
        {helmet.meta.toComponent()}
        {helmet.title.toComponent()}
        {assets.css &&
          assets.css.map((c, idx) => (
            <link key={idx} href={c} rel="stylesheet" />
          ))}
      </head>

      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root" dangerouslySetInnerHTML={{ __html: content }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APOLLO_STATE__=${JSON.stringify(state).replace(
              /</g,
              '\\u003c',
            )};`,
          }}
        />
        {assets.js &&
          assets.js.map((j, idx) => (
            <script key={idx} src={j} />
          ))}
      </body>
    </html>
  );
};

export default Html;
