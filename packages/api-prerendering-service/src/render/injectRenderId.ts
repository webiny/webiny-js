/**
 * TODO: Figure out correct types.
 */
interface Params {
    id: string;
}
export default ({ id }: Params) =>
    async (tree: Record<string, any>) => {
        console.log("Injecting render hash (__PS_RENDER_ID__) into HTML.");

        tree.match({ tag: "head" }, (node: Record<string, any>) => {
            node.content.push(`<script>window.__PS_RENDER_ID__ = "${id}";</script>`);
            return node;
        });
    };
