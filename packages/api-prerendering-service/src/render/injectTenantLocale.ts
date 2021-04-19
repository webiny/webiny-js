export default args => async tree => {
    console.log("Injecting tenant and locale into HTML...");
    const meta = args?.args?.args?.configuration?.meta;
    if (!meta) {
        return;
    }

    tree.match({ tag: "body" }, node => {
        const index = node.content.findIndex(n => n.tag === "div" && n.attrs.id === "root");
        if (meta.tenant) {
            const tenant = `<script>window.__PS_RENDER_TENANT__ = "${meta.tenant}";</script>`;
            node.content.splice(index + 1, 0, tenant);
        }

        if (meta.locale) {
            const locale = `<script>window.__PS_RENDER_LOCALE__ = "${meta.locale}";</script>`;
            node.content.splice(index + 1, 0, locale);
        }

        return node;
    });
};
