import render from "@webiny/api-prerendering-service/render/renderUrl";
import prettier from "prettier";

const BASE_HTML = `<html><body><div id="root">A sample page.</div></body></html>`;

describe(`"renderUrl" Function Test`, () => {
    it("should insert basic meta data into the received HTML", async () => {
        const [[html], meta] = await render("https://some-url.com", {
            configuration: {},
            renderUrlFunction: () => {
                return {
                    content: BASE_HTML,
                    meta: {}
                };
            }
        });

        const snapshot = `<html>
  <body>
    <div id="root">A sample page.</div>
    <script>
      window.__APOLLO_STATE__ = undefined;
    </script>
    <script>
      window.__PS_RENDER_TS__ = "${meta.ts}";
    </script>
    <script>
      window.__PS_RENDER_ID__ = "${meta.id}";
    </script>
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
            args: {
                configuration: {
                    meta: {
                        tenant: "root",
                        locale: "en-US"
                    }
                }
            },
            renderUrlFunction: () => {
                return {
                    content: BASE_HTML,
                    meta: {}
                };
            }
        });

        const snapshot = `<html>
  <body>
    <div id="root">A sample page.</div>
    <script>
      window.__PS_RENDER_LOCALE__ = "en-US";
    </script>
    <script>
      window.__PS_RENDER_TENANT__ = "root";
    </script>
    <script>
      window.__APOLLO_STATE__ = undefined;
    </script>
    <script>
      window.__PS_RENDER_TS__ = "${meta.ts}";
    </script>
    <script>
      window.__PS_RENDER_ID__ = "${meta.id}";
    </script>
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
