import render from "~/render/renderUrl";
import prettier from "prettier";

const BASE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1,shrink-to-fit=no"
    />
    <meta name="theme-color" content="#000000" />
    <title>Product A1</title>
    <link href="/static/css/2.1edd21d9.chunk.css" rel="stylesheet" />
    <link href="/static/css/main.30bba61e.chunk.css" rel="stylesheet" />
  </head>
  <body>
    <script src="/static/js/2.d0c5c7a4.chunk.js"></script>
    <script src="/static/js/main.e1199ebd.chunk.js"></script>
  </body>
</html>
`;

describe(`Link Preloading Test`, () => {
    it("should insert preloading attributes to CSS/JS links", async () => {
        const [[html], meta] = await render("https://some-url.com", {
            context: {} as any,
            args: {
                path: "path",
                tenant: "root",
                locale: "en-US"
            },
            renderUrlFunction: async () => {
                return {
                    content: BASE_HTML,
                    meta: {
                        gqlCache: {},
                        apolloState: {}
                    }
                };
            }
        });

        const snapshot = `<!DOCTYPE html>
<html lang="en">
  <head>
    <link as="style" rel="preload" href="/static/css/2.1edd21d9.chunk.css" />
    <link as="style" rel="preload" href="/static/css/main.30bba61e.chunk.css" />
    <link as="script" rel="preload" href="/static/js/2.d0c5c7a4.chunk.js" />
    <link as="script" rel="preload" href="/static/js/main.e1199ebd.chunk.js" />
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1,shrink-to-fit=no"
    />
    <meta name="theme-color" content="#000000" />
    <title>Product A1</title>
    <link
      data-link-preload=""
      data-link-preload-type="markup"
      href="/static/css/2.1edd21d9.chunk.css"
      rel="stylesheet"
    />
    <link
      data-link-preload=""
      data-link-preload-type="markup"
      href="/static/css/main.30bba61e.chunk.css"
      rel="stylesheet"
    />
    <script>
      window.__PS_RENDER_ID__ = "${meta.id}";
    </script>
    <script>
      window.__PS_RENDER_TS__ = "${meta.ts}";
    </script>
    <script>
      window.__APOLLO_STATE__ = undefined;
    </script>
  </head>
  <body>
    <script
      data-link-preload=""
      data-link-preload-type="markup"
      src="/static/js/2.d0c5c7a4.chunk.js"
    ></script>
    <script
      data-link-preload=""
      data-link-preload-type="markup"
      src="/static/js/main.e1199ebd.chunk.js"
    ></script>
  </body>
</html>
`;

        expect(
            prettier.format(html.body, {
                parser: "html"
            })
        ).toEqual(snapshot);
    });
});
