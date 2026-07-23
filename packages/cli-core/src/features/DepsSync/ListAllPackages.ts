import { listWorkspaces } from "@webiny/stdlib/node";

export class ListAllPackages {
    public list(paths: string[]): string[] {
        const results: string[] = [];
        for (const p of paths) {
            results.push(
                ...listWorkspaces({
                    cwd: p
                }).map(pkg => {
                    return pkg.path;
                })
            );
        }
        return results;
    }
}
