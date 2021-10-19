export default ({ id }) =>
    async tree => {
        console.log("Injecting render hash (__PS_RENDER_ID__) into HTML.");

        tree.match({ tag: "head" }, node => {
            node.content.push(`<script>window.__PS_RENDER_ID__ = "${id}";</script>`);
            return node;
        });
    };
