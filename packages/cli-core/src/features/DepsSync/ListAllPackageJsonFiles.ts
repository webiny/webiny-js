import fastGlob from "fast-glob";

const defaultIgnore = ["**/node_modules/**", "**/dist/**", "**/build/**"];

export interface IListAllPackageJsonFilesListParams {
    targets: string[];
    ignore?: string[];
}

export class ListAllPackageJsonFiles {
    public list(params: IListAllPackageJsonFilesListParams): string[] {
        const targets = params.targets;
        const ignore = defaultIgnore.concat(params.ignore || []);

        const results: string[] = [];

        for (const target of targets) {
            const files = fastGlob.sync(
                `${target}/**/**/{package.json,*.package.json,dependencies.json}`,
                {
                    ignore
                }
            );
            results.push(...files);
        }

        return results;
    }
}
