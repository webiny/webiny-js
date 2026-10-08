export class ListAllPackages {
    public async list(paths: string[]): Promise<string[]> {
        // Imported here rather than at the top of the file. The CLI imports every command's code
        // on every run, even `webiny --help`, and `@webiny/stdlib/node` is about 60 modules that only
        // `sync-dependencies` and `verify-dependencies` ever need.
        const { listWorkspaces } = await import("@webiny/stdlib/node");

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
