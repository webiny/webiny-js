import { createImplementation } from "@webiny/di";
import fs from "fs";
import path from "path";
import { ListPackagesService, ScanExportsFoldersService } from "../../abstractions/index.js";

type ScanExportsFoldersServiceNamespace = typeof ScanExportsFoldersService;

export class DefaultScanExportsFoldersService
    implements ScanExportsFoldersServiceNamespace.Interface
{
    execute(
        packages: ListPackagesService.Package[]
    ): Map<string, ScanExportsFoldersServiceNamespace.ExportFile[]> {
        const fileMap = new Map<string, ScanExportsFoldersServiceNamespace.ExportFile[]>();

        for (const pkg of packages) {
            const exportsFolder = pkg.paths.packageFolder.join("src", "exports").toString();

            if (!fs.existsSync(exportsFolder)) {
                continue;
            }

            const files = this.getAllFiles(exportsFolder);

            for (const absolutePath of files) {
                if (!absolutePath.endsWith(".ts")) {
                    continue;
                }

                const relativePath = path.relative(exportsFolder, absolutePath);

                if (!fileMap.has(relativePath)) {
                    fileMap.set(relativePath, []);
                }

                fileMap.get(relativePath)!.push({
                    relativePath,
                    packageName: pkg.name,
                    absolutePath
                });
            }
        }

        return fileMap;
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);

            if (file.isDirectory()) {
                this.getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        }

        return arrayOfFiles;
    }
}

export const scanExportsFoldersService = createImplementation({
    abstraction: ScanExportsFoldersService,
    implementation: DefaultScanExportsFoldersService,
    dependencies: []
});
