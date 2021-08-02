export default ({ ts }) =>
    async tree => {
        console.log("Injecting render timestamp (__PS_RENDER_TS__) into HTML.");

        const apolloScript = `<script>window.__PS_RENDER_TS__ = "${ts}";</script>`;

        tree.match({ tag: "body" }, node => {
            const index = node.content.findIndex(n => n.tag === "div" && n.attrs.id === "root");
            node.content.splice(index + 1, 0, apolloScript);
            return node;
        });
    };
