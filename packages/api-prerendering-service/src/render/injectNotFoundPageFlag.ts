import { NodeAPI } from "posthtml";
import { getIsNotFoundPage } from "../utils";
import { RenderUrlPostHtmlParams } from "~/render/types";

export default (args: Pick<RenderUrlPostHtmlParams, "args">) => async (tree: NodeAPI) => {
    const render = args?.args?.args;

    if (!getIsNotFoundPage(render)) {
        return;
    }

    console.log("Injecting not-found page path (__PS_NOT_FOUND_PAGE__) into HTML.");

    tree.match({ tag: "head" }, node => {
        if (!node.content) {
            node.content = [];
        }
        node.content.push(`<script>window.__PS_NOT_FOUND_PAGE__ = "${render?.path}";</script>`);
        return node;
    });
};
