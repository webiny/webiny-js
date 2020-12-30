export default (page, { log, renderId }) => async tree => {
    log("Injecting render hash (__PS_RENDER_ID__) into HTML.");

    const apolloScript = `<script>window.__PS_RENDER_ID__ = "${renderId}";</script>`;

    tree.match({ tag: "body" }, node => {
        const index = node.content.findIndex(n => n.tag === "div" && n.attrs.id === "root");
        node.content.splice(index + 1, 0, apolloScript);
        return node;
    });
};
