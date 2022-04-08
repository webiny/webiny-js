import { NodeAPI, Node } from "posthtml";

export default () => async (tree: NodeAPI) => {
    // TODO pass this via params or IoC
    const baseUrl = process.env["DELIVERY_URL"];
    if (!baseUrl) {
        return;
    }

    console.log("Replacing relative asset paths with absolute URLs");

    tree.walk(node => {
        switch (node.tag) {
            case "link":
                prefixUrl(node, "href", baseUrl);
                break;
            case "script":
                prefixUrl(node, "src", baseUrl);
                break;
            case "img":
                prefixUrl(node, "src", baseUrl);
                // TODO handle srcset
                break;
        }

        return node;
    });
};

function prefixUrl(node: Node, attr: string, host: string) {
    if (!node.attrs) {
        return;
    }

    const href = node.attrs[attr];
    if (href && href.startsWith("/")) {
        node.attrs[attr] = host + href;
    }
}
