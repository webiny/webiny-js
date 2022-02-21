import { NodeAPI } from "posthtml";
import { RenderUrlPostHtmlParams } from "~/render/types";

const stringifyApolloState = (state?: any): string | undefined => {
    if (state === undefined || state === null) {
        return state;
    }
    try {
        return JSON.stringify(state).replace(/</g, "\\u003c");
    } catch (ex) {
        console.log("Could not stringify state.");
        console.log(ex.message);
    }
    return undefined;
};

export default ({ render }: Pick<RenderUrlPostHtmlParams, "render">) =>
    async (tree: NodeAPI) => {
        console.log("Injecting Apollo state into HTML.");

        tree.match({ tag: "head" }, node => {
            const script = `<script>window.__APOLLO_STATE__ = ${stringifyApolloState(
                render.meta.apolloState
            )};</script>`;

            node.content.push(script);
            return node;
        });
    };
