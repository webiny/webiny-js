import render from "~/render/renderUrl";
import prettier from "prettier";

const BASE_HTML = `<html lang="en"><head><meta charset="utf-8" /></head><body><div id="root">A sample page.</div></body></html>`;

describe(`"renderUrl" Function Test`, () => {
    it("should insert basic meta data into the received HTML", async () => {
        const [[html], meta] = await render("https://some-url.com", {
            context: {} as any,
            args: {},
            configuration: {},
            renderUrlFunction: async () => {
                return {
                    content: BASE_HTML,
                    meta: {}
                };
            }
        });

        const snapshot = `<html lang="en">
  <head>
    <meta charset="utf-8" />
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
    <div id="root">A sample page.</div>
  </body>
</html>
`;

        expect(
            prettier.format(html.body, {
                parser: "html"
            })
        ).toEqual(snapshot);
    });

    it("should insert tenant and locale data into the received HTML", async () => {
        const [[html], meta] = await render("https://some-url.com", {
            context: {} as any,
            args: {
                path: "/",
                tenant: "root",
                locale: "en-US"
            },
            renderUrlFunction: async () => {
                return {
                    content: BASE_HTML,
                    meta: {}
                };
            }
        });

        const snapshot = `<html lang="en">
  <head>
    <meta charset="utf-8" />
    <script>
      window.__PS_RENDER_ID__ = "${meta.id}";
    </script>
    <script>
      window.__PS_RENDER_TS__ = "${meta.ts}";
    </script>
    <script>
      window.__APOLLO_STATE__ = undefined;
    </script>
    <script>
      window.__PS_RENDER_TENANT__ = "root";
    </script>
    <script>
      window.__PS_RENDER_LOCALE__ = "en-US";
    </script>
  </head>
  <body>
    <div id="root">A sample page.</div>
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
