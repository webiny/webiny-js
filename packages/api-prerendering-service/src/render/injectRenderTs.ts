/**
 * TODO: Figure out correct types.
 */
interface Params {
    ts: string;
}
export default ({ ts }: Params) =>
    async (tree: Record<string, any>) => {
        console.log("Injecting render timestamp (__PS_RENDER_TS__) into HTML.");

        tree.match({ tag: "head" }, (node: Record<string, any>) => {
            node.content.push(`<script>window.__PS_RENDER_TS__ = "${ts}";</script>`);
            return node;
        });
    };
