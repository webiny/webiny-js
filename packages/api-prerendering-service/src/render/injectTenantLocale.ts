import { RenderUrlPostHtmlParams } from "~/render/types";
import { NodeAPI } from "posthtml";

export default (args: Pick<RenderUrlPostHtmlParams, "args">) => async (tree: NodeAPI) => {
    console.log("Injecting tenant and locale into HTML...");
    const render = args?.args?.args;
    if (!render) {
        return;
    }

    tree.match({ tag: "head" }, node => {
        if (!node.content) {
            node.content = [];
        }
        if (render.tenant) {
            node.content.push(`<script>window.__PS_RENDER_TENANT__ = "${render.tenant}";</script>`);
        }

        if (render.locale) {
            node.content.push(`<script>window.__PS_RENDER_LOCALE__ = "${render.locale}";</script>`);
        }

        return node;
    });
};
