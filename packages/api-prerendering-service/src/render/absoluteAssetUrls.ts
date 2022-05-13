import { NodeAPI, Node } from "posthtml";
import { parse as parseSrcset, stringify as stringifySrcset, SrcSetDefinition } from "srcset";

export default () => async (tree: NodeAPI) => {
    // We are rewriting asset URLs from relative to absolute.
    // This is mostly for stage-rollout setup in which we have additional intermediate gateway,
    // that splits traffic between multiple variants.
    // For specific variant we have website delivery URL and gateway URL, and they are different.
    // If we had a script `/vendors.js`, because it's relative to gateway URL,
    // it would have to go through whole traffic splitting logic (based on cookies), may lead to bugs.
    // Assets for each variant need to have a well defined URL to make sure everything works fine.
    // By rewriting asset URLs we basically tell application to retrieve assets directly from variant,
    // without traffic splitting logic in between.

    const baseUrl = process.env["DELIVERY_URL"];
    if (!baseUrl) {
        return;
    }

    console.log("Replacing relative asset paths with absolute URLs");

    tree.walk(node => {
        switch (node.tag) {
            case "link":
                prefixUrl(node, "href", baseUrl);
                break;
            case "script":
                prefixUrl(node, "src", baseUrl);
                break;
            case "img":
                prefixUrl(node, "src", baseUrl);

                // Handle also srcset property for responsive images.
                if (node.attrs && node.attrs["srcset"]) {
                    const srcsetParsed = parseSrcset(node.attrs["srcset"]);
                    const srcsetRebased = srcsetParsed.map<SrcSetDefinition>(src => {
                        if (src.url.startsWith("/")) {
                            return {
                                url: baseUrl + src.url,
                                density: src.density,
                                width: src.width
                            };
                        }

                        return src;
                    });

                    node.attrs["srcset"] = stringifySrcset(srcsetRebased);
                }

                break;
        }

        return node;
    });
};

function prefixUrl(node: Node, attr: string, host: string) {
    if (!node.attrs) {
        return;
    }

    const href = node.attrs[attr];
    if (href && href.startsWith("/")) {
        node.attrs[attr] = host + href;
    }
}
