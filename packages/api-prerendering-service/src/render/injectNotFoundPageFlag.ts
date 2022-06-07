import { RenderUrlPostHtmlParams } from "~/render/types";
import { NodeAPI } from "posthtml";

export default (args: Pick<RenderUrlPostHtmlParams, "args">) => async (tree: NodeAPI) => {
    const meta = args?.args?.args?.configuration?.meta;
    if (!meta || !meta.notFoundPage) {
        return;
    }

    const path = args?.args?.args?.path;

    console.log("Injecting not-found page path (__PS_NOT_FOUND_PAGE__) into HTML.");

    tree.match({ tag: "head" }, node => {
        if (!node.content) {
            node.content = [];
        }
        node.content.push(`<script>window.__PS_NOT_FOUND_PAGE__ = "${path}";</script>`);
        return node;
    });
};
