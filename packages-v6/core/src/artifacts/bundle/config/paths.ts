import path from "path";
import fs from "fs";
// @ts-ignore
import getWorkspaces from "get-yarn-workspaces";

const isFolder = (p: string) => fs.statSync(p).isDirectory();
const fixPath = (pkg: string) => pkg.replace(/\//g, path.sep);

const allWorkspaces = () => {
    return (getWorkspaces() as string[]).filter(isFolder).map(fixPath);
};

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
        publicUrl: "/",
        servedPath: "/",
        allWorkspaces: allWorkspaces()
    };
};
