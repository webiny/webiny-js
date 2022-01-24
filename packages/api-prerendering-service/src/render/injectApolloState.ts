/**
 * TODO: Figure out correct types.
 */
interface Params {
    render: Record<string, any>;
}
export default ({ render }: Params) =>
    async (tree: Record<string, any>) => {
        console.log("Injecting Apollo state into HTML.");

        tree.match({ tag: "head" }, (node: Record<string, any>) => {
            const script = `<script>window.__APOLLO_STATE__ = ${JSON.stringify(
                render.meta.apolloState
            )};</script>`;

            node.content.push(script);
            return node;
        });
    };
