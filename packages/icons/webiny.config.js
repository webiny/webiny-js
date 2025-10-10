import fs from "fs";
import path, { join } from "path";

export default {
    commands: {
        build: async () => {
            fs.rmSync(join(import.meta.dirname, "./dist"), { recursive: true, force: true });
            const destDir = path.resolve(import.meta.dirname, "dist");
            fs.mkdirSync(destDir, { recursive: true });

            copyToDist("package.json");
            copyToDist("LICENSE");

            // Copy all icons from `@material-design-icons/svg/outlined` folder to `dist` folder.
            // We're doing this because simply re-exporting icons from `@material-ui/icons` package
            // was not possible.
            const pkgUrl = await import.meta.resolve("@material-design-icons/svg/package.json");
            const pkgDirPath = path.dirname(new URL(pkgUrl).pathname);

            const outlinedIconsDirPath = path.resolve(pkgDirPath, "outlined");

            fs.readdirSync(outlinedIconsDirPath).forEach(file => {
                const sourceFile = path.join(outlinedIconsDirPath, file);
                const destFile = path.join(destDir, file);
                fs.copyFileSync(sourceFile, destFile);
            });

            // Copy all icons from `extraIcons` folder to `dist` folder.
            const extraIconsFolderPath = "./extraIcons";

            fs.readdirSync(extraIconsFolderPath).forEach(file => {
                const sourceFile = path.join(extraIconsFolderPath, file);
                const destFile = path.join(destDir, file);
                fs.copyFileSync(sourceFile, destFile);
            });
        }
    }
};

const copyToDist = path => {
    const from = join(import.meta.dirname, path);
    const to = join(import.meta.dirname, "dist", path);
    fs.copyFileSync(from, to);
};
