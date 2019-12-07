import React, { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
// Use `raw-loader` to copy the value of index.html into the SSR bundle.
// This way the bundle contains all it's dependencies and can be used entirely on its own.
import indexHtml from "!!raw-loader!../build/index.html";

export default (content, helmet, state) => {
    const replace = `
        <div id="root">${content}</div>
        <script>
            window.__APOLLO_STATE__=${JSON.stringify(state).replace(/</g, "\\\u003c")}
        </script>
    `;

    const meta = renderToStaticMarkup(
        <Fragment>
            {helmet.meta.toComponent()}
            {helmet.title.toComponent()}
        </Fragment>
    );

    return indexHtml
        .replace(`<div id="root"></div>`, replace)
        .replace(/<title.*?<\/title>/, "")
        .replace(`</head>`, meta + "</head>");
};
