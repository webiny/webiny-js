// @ts-expect-error
import getPackages from "get-yarn-workspaces";

export class ListAllPackages {
    public list(paths: string[]): string[] {
        const results: string[] = [];
        for (const p of paths) {
            results.push(...getPackages(p));
        }
        return results;
    }
}
