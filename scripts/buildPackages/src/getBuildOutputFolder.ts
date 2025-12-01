import path from "path";

export function getBuildOutputFolder({ packageFolder }: { packageFolder: string }) {
    return path.join(packageFolder, "dist");
}
