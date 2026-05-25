import path from "path";
import getWorkspaces from "get-yarn-workspaces";

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
            //"@webiny/cli",
            "apollo-cache",
            "apollo-client",
            "apollo-link",
            "apollo-utilities",
            "graphql",
            "react-dom"
        ],
        devDependencies: true,
        peerDependencies: true
    },
    ignoreDirs: ["node_modules/", "dist/", "build/", "nextjs/", "packages/admin-ui/storybook-static/"],
    packages: getWorkspaces()
        .filter(pkg => !pkg.includes("system-requirements"))
        .map(pkg => pkg.replace(/\//g, path.sep).replace(process.cwd() + path.sep, ""))
};
