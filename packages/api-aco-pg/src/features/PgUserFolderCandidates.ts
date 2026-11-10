import { UserFolderCandidates } from "@webiny/api-aco/features/flp/ListFolderAccess/abstractions.js";
import { FolderModelProvider } from "@webiny/api-aco/domain/folder/abstractions.js";
import { CodeFlpsProvider } from "@webiny/api-aco/features/flp/shared/abstractions.js";
import {
    CodeFlpMerger,
    CodeFlpPath,
    CodeFlpTarget
} from "@webiny/api-aco/features/flp/shared/index.js";
import type { FolderLevelPermission } from "@webiny/api-aco/flp/flp.types.js";
import { FolderCatalog } from "~/catalog/FolderCatalog.js";

/**
 * Only the folders a user's grants can reach, from the folder catalog's grants: the subtrees under
 * a grant to the user or one of their teams, the folders granted to them in code, and the public
 * folders. Each comes with its permissions as `ListFlpsUseCase` would report them: worked out
 * from the catalog, with the code-defined ones merged in.
 */
class PgUserFolderCandidatesImpl implements UserFolderCandidates.Interface {
    public constructor(
        private readonly catalog: FolderCatalog.Interface,
        private readonly folderModelProvider: FolderModelProvider.Interface,
        // Missing without the folder-level permissions entitlement: then nothing is granted in code.
        private readonly codeFlps: CodeFlpsProvider.Interface | undefined,
        // Not called: the catalog answers for every folder.
        _decoratee: UserFolderCandidates.Interface
    ) {}

    public async list({
        type,
        parentId,
        targets
    }: UserFolderCandidates.Params): Promise<FolderLevelPermission[]> {
        const folderModel = await this.folderModelProvider.get();

        // Code-defined grants are not in the catalog; their paths are matched instead.
        const paths = (this.codeFlps ? await this.codeFlps.listFlps() : [])
            .filter(
                flp =>
                    flp.type === type &&
                    flp.permissions.some(permission => {
                        const { target, level } = CodeFlpTarget.resolve(permission);
                        return level !== "no-access" && targets.includes(target);
                    })
            )
            .map(flp => CodeFlpPath.parse(flp.path));

        const ids = await this.catalog.listCandidateIds(folderModel, {
            type,
            parentId,
            targets,
            paths
        });
        const effective = await this.catalog.getEffective(folderModel, ids);

        const flps: FolderLevelPermission[] = [];
        for (const id of ids) {
            const flp = effective.get(id);
            if (!flp) {
                continue;
            }
            if (!this.codeFlps) {
                flps.push(flp);
                continue;
            }
            const codePermissions = await this.codeFlps.getPermissions({
                type: flp.type,
                path: flp.path
            });
            flps.push(CodeFlpMerger.merge(flp, codePermissions));
        }
        return flps;
    }
}

export const PgUserFolderCandidates = UserFolderCandidates.createDecorator({
    decorator: PgUserFolderCandidatesImpl,
    // `CodeFlpsProvider` is optional: `CodeFlpsFeature` does not register it unless the project has
    // the folder-level permissions entitlement.
    dependencies: [FolderCatalog, FolderModelProvider, [CodeFlpsProvider, { optional: true }]]
});
