import path from "path";
import { PackageJSON } from "./types";

export function getBuildOutputFolder({
    packageJson,
    packageFolder
}: {
    packageJson: PackageJSON;
    packageFolder: string;
}) {
    const webinyConfig = packageJson.webiny;
    // `dist` is the default output folder for v5 packages.
    let buildFolder = "dist";
    if (webinyConfig) {
        // Until the need arises, let's just use the default `lib` folder.
        buildFolder = "lib";
    }

    return path.join(packageFolder, buildFolder);
}
