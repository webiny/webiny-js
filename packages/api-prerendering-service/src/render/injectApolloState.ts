export default (page, { log }) => async tree => {
    log("Injecting Apollo state into HTML");

    const apolloState = await page.evaluate(() => {
        // @ts-ignore
        return window.getApolloState();
    });

    const apolloScript = `<script>window.__APOLLO_STATE__ = ${JSON.stringify(
        apolloState
    )};</script>`;

    tree.match({ tag: "body" }, node => {
        const index = node.content.findIndex(n => n.tag === "div" && n.attrs.id === "root");
        node.content.splice(index + 1, 0, apolloScript);

        return node;
    });
};
