import { RenderUrlPostHtmlParams } from "~/render/types";
import { NodeAPI } from "posthtml";

export default ({ id }: Pick<RenderUrlPostHtmlParams, "id">) =>
    async (tree: NodeAPI) => {
        console.log("Injecting render hash (__PS_RENDER_ID__) into HTML.");

        tree.match({ tag: "head" }, node => {
            if (!node.content) {
                node.content = [];
            }
            node.content.push(`<script>window.__PS_RENDER_ID__ = "${id}";</script>`);
            return node;
        });
    };
