import path from "path";

export function getPulumiWorkDir(rootDir: string, appPath: string) {
    return path.join(rootDir, ".pulumi", appPath);
}
