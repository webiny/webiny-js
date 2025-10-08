import fs from "fs-extra";
import path from "path";
import { AbstractGenerator } from "./AbstractGenerator";

export class ReadmeGenerator extends AbstractGenerator {
    async generate() {
        const existingReadmePath = path.join(this.webinyPackage.paths.rootFolder, "README.md");
        if (fs.existsSync(existingReadmePath)) {
            // Copy readme into `dist` folder if it exists.
            fs.copyFileSync(
                existingReadmePath,
                path.join(this.webinyPackage.paths.distFolder, "README.md")
            );
            return;
        }

        // Create a basic README.md file.
        const readmeContent = this.generateBasicReadme();
        const readmePath = path.join(this.webinyPackage.paths.distFolder, "README.md");

        console.log("readmePath", readmePath);

        fs.writeFileSync(readmePath, readmeContent);
    }

    private generateBasicReadme(): string {
        const template = fs.readFileSync(path.join(__dirname, "README.txt"), "utf-8");
        const packageJson = this.webinyPackage.getPackageJson();
        return template
            .replace(/PACKAGE_NAME/g, packageJson.name || "unknown-package")
            .replace(/DESCRIPTION/g, packageJson.description || "No description provided.");
    }
}
