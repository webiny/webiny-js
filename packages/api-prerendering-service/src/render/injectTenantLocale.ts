/**
 * TODO: Figure out correct types.
 */
export default (args: Record<string, any>) => async (tree: Record<string, any>) => {
    console.log("Injecting tenant and locale into HTML...");
    const meta = args?.args?.args?.configuration?.meta;
    if (!meta) {
        return;
    }

    tree.match({ tag: "head" }, (node: Record<string, any>) => {
        if (meta.tenant) {
            node.content.push(`<script>window.__PS_RENDER_TENANT__ = "${meta.tenant}";</script>`);
        }

        if (meta.locale) {
            node.content.push(`<script>window.__PS_RENDER_LOCALE__ = "${meta.locale}";</script>`);
        }

        return node;
    });
};
