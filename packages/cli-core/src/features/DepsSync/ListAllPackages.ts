import { listWorkspaces } from "@webiny/stdlib/node";

export class ListAllPackages {
    public list(paths: string[]): string[] {
        const results: string[] = [];
        for (const p of paths) {
            const workspaces = listWorkspaces({
                cwd: p
            });
            for (const workspace of workspaces) {
                results.push(workspace.path);
            }
        }
        return results;
    }
}
