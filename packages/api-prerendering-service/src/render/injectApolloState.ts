export default ({ render }) =>
    async tree => {
        console.log("Injecting Apollo state into HTML.");

        tree.match({ tag: "head" }, node => {
            const script = `<script>window.__APOLLO_STATE__ = ${JSON.stringify(
                render.meta.apolloState
            ).replace(/</g, "\\u003c")};</script>`;

            node.content.push(script);
            return node;
        });
    };
