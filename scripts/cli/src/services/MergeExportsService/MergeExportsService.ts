import { createImplementation } from "@webiny/di";
import { MergeExportsService, ParseExportsFileService } from "../../abstractions/index.js";

type MergeExportsServiceNamespace = typeof MergeExportsService;

export class DefaultMergeExportsService implements MergeExportsServiceNamespace.Interface {
    constructor(private parseExportsFileService: ParseExportsFileService.Interface) {}

    execute(inputs: MergeExportsServiceNamespace.ExportFileInput[]): string {
        const mergedExports: Array<{
            namedExports: string[];
            source: string;
            isWildcard: boolean;
        }> = [];

        for (const input of inputs) {
            const exportStatements = this.parseExportsFileService.execute(
                input.fileContent,
                input.filePath
            );

            for (const statement of exportStatements) {
                const sourceWithPackageName = statement.source.replace(
                    /^~\//,
                    `${input.packageName}/`
                );

                mergedExports.push({
                    namedExports: statement.namedExports,
                    source: sourceWithPackageName,
                    isWildcard: statement.isWildcard
                });
            }
        }

        let output = "";
        for (const exportStatement of mergedExports) {
            if (exportStatement.isWildcard) {
                output += `export * from "${exportStatement.source}";\n`;
            } else {
                const namedExportsStr = exportStatement.namedExports.join(", ");
                output += `export { ${namedExportsStr} } from "${exportStatement.source}";\n`;
            }
        }

        return output;
    }
}

export const mergeExportsService = createImplementation({
    abstraction: MergeExportsService,
    implementation: DefaultMergeExportsService,
    dependencies: [ParseExportsFileService]
});
