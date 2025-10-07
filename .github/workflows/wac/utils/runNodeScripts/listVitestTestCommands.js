import fs from "fs";
import path from "path";
import { TestablePackage } from "./listVitestTestCommands/TestablePackage.js";

export const listVitestPackages = (storageOps, whitelistedPackages = []) => {
    const projectFolderPath = path.join(import.meta.dirname, "../../../../..");
    const packagesFolderPath = path.join(projectFolderPath, "packages");

    return fs
        .readdirSync(packagesFolderPath)
        .filter(name => !name.startsWith("."))
        .map(name => {
            if (whitelistedPackages.length && !whitelistedPackages.includes(name)) {
                return null;
            }

            const packageFolderPath = path.join(packagesFolderPath, name);
            return new TestablePackage(packageFolderPath);
        })
        .filter(Boolean)
        .filter(pkg => pkg.testingEnabled() && pkg.hasTests())
        .filter(pkg => {
            if (storageOps) {
                return pkg.testedWithStorageOps(storageOps);
            }

            return pkg.testedWithoutStorageOps();
        });
};

const args = process.argv.slice(2); // Removes the first two elements

const [storageOps = "", whitelistedPackages] = JSON.parse(args[0]);

const testCommands = listVitestPackages(storageOps, whitelistedPackages)
    .map(pkg => pkg.getTestCommands())
    .flat();

console.log(JSON.stringify(testCommands));
