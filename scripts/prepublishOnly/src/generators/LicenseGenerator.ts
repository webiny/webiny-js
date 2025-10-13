import fs from "fs-extra";
import path from "path";
import { AbstractGenerator } from "./AbstractGenerator";

export class LicenseGenerator extends AbstractGenerator {
    static override displayName = "LICENSE.md Generator";
    override displayName = "LICENSE.md Generator";

    async generate() {
        const pkgJson = this.webinyPackage.getPackageJson();
        if (pkgJson.license === "Webiny Enterprise") {
            this.log(`Generating Enterprise license file...`);
            const licenseTemplatePath = path.join(import.meta.dirname, "licenses", "ee.txt");
            fs.copyFileSync(
                licenseTemplatePath,
                path.join(this.webinyPackage.paths.distFolder, "LICENSE")
            );
            return;
        }

        this.log(`Generating MIT license file...`);
        const licenseTemplatePath = path.join(import.meta.dirname, "licenses", "mit.txt");
        fs.copyFileSync(
            licenseTemplatePath,
            path.join(this.webinyPackage.paths.distFolder, "LICENSE")
        );
    }
}
