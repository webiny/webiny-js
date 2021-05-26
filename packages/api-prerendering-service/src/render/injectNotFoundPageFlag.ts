export default args => async tree => {
    const meta = args?.args?.args?.configuration?.meta;
    if (!meta || !meta.notFoundPage) {
        return;
    }

    console.log("Injecting not-found page flag (__PS_NOT_FOUND_PAGE__) into HTML.");

    const apolloScript = `<script>window.__PS_NOT_FOUND_PAGE__ = true;</script>`;

    tree.match({ tag: "body" }, node => {
        const index = node.content.findIndex(n => n.tag === "div" && n.attrs.id === "root");
        node.content.splice(index + 1, 0, apolloScript);
        return node;
    });
};
