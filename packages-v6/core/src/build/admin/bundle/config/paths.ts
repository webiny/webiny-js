import path from "path";
import fs from "fs";
import url from "url";
// @ts-ignore
import getWorkspaces from "get-yarn-workspaces";

const isFolder = (p: string) => fs.statSync(p).isDirectory();
const fixPath = (pkg: string) => pkg.replace(/\//g, path.sep);

const allWorkspaces = () => {
    return (getWorkspaces() as string[]).filter(isFolder).map(fixPath);
};

const envPublicUrl = process.env.PUBLIC_URL;

function ensureSlash(inputPath: string, needsSlash: boolean) {
    const hasSlash = inputPath.endsWith("/");
    if (hasSlash && !needsSlash) {
        return inputPath.substr(0, inputPath.length - 1);
    } else if (!hasSlash && needsSlash) {
        return `${inputPath}/`;
    } else {
        return inputPath;
    }
}

const getPublicUrl = (appPackageJson: string) => envPublicUrl || require(appPackageJson).homepage;

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
function getServedPath(appPackageJson: string) {
    const publicUrl = getPublicUrl(appPackageJson);
    const servedUrl = envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : "/");
    return ensureSlash(servedUrl, true);
}

const moduleFileExtensions = [
    "web.mjs",
    "mjs",
    "web.js",
    "js",
    "web.ts",
    "ts",
    "web.tsx",
    "tsx",
    "json",
    "web.jsx",
    "jsx"
];

interface Params {
    appIndexJs: string;
    cwd: string;
}

export interface Paths {
    appPath: string;
    appBuild: string;
    appPublic: string;
    appHtml: string;
    appIndexJs: string;
    appPackageJson: string;
    appSrc: string;
    appTsConfig: string;
    yarnLockFile: string;
    appNodeModules: string;
    publicUrl: string;
    servedPath: string;
    allWorkspaces: string[];
    moduleFileExtensions: string[];
}

export default ({ appIndexJs, cwd }: Params): Paths => {
    // Make sure any symlinks in the project folder are resolved:
    // https://github.com/facebook/create-react-app/issues/637
    const appDirectory = fs.realpathSync(cwd);
    const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath);

    return {
        appPath: resolveApp("."),
        appBuild: resolveApp("build"),
        appPublic: resolveApp("public"),
        appHtml: resolveApp("public/index.html"),
        appIndexJs: appIndexJs,
        appPackageJson: resolveApp("package.json"),
        appSrc: resolveApp("src"),
        appTsConfig: resolveApp("tsconfig.json"),
        yarnLockFile: resolveApp("yarn.lock"),
        appNodeModules: resolveApp("node_modules"),
        publicUrl: getPublicUrl(resolveApp("package.json")),
        servedPath: getServedPath(resolveApp("package.json")),
        allWorkspaces: allWorkspaces(),
        moduleFileExtensions
    };
};
