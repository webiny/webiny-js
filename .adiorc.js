import path from "path";
import { listWorkspaces } from "@webiny/stdlib/node";

export default {
    ignore: {
        src: ["~tests", "~"],
        dependencies: [
            // Packages below are defined as peerDependencies in many 3rd party packages
            // and make yarn go crazy with warnings. We define these packages as "dependencies"
            // in our own packages, but we don't directly use them:
            "@emotion/react",
            "@svgr/webpack",
            "@types/react",
            "graphql",
            "react-dom"
        ],
        devDependencies: true,
        peerDependencies: true
    },
    ignoreDirs: [
        "node_modules/",
        "dist/",
        "build/",
        "nextjs/",
        "packages/admin-ui/storybook-static/"
    ],
    packages: listWorkspaces()
        .map(pkg => {
            return pkg.path;
        })
        .filter(pkg => !pkg.includes("system-requirements"))
        .map(pkg => pkg.replace(/\//g, path.sep).replace(process.cwd() + path.sep, ""))
};
