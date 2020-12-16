module.exports = links => async tree => {
    console.log("-> Injecting Apollo state prefetching links");

    tree.match({ tag: "head" }, node => {
        for (let i = 0; i < links.length; i++) {
            node.content.unshift(
                `<link rel="preload" href="${links[i]}" as="fetch" type="application/json" crossorigin>`
            );
        }
        // <link rel="prefetch" as=”script” href=”1.bundle.js”>
        return node;
    });
};
