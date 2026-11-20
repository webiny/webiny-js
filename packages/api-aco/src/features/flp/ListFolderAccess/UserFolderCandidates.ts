import { UserFolderCandidates as Abstraction } from "./abstractions.js";
import { ListFlpsUseCase } from "~/features/flp/ListFlps/abstractions.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";

/** Every folder of the type (or a parent's children): no storage index to narrow them with. */
class AllFoldersCandidatesImpl implements Abstraction.Interface {
    constructor(private listFlps: ListFlpsUseCase.Interface) {}

    list({ type, parentId }: Abstraction.Params): Promise<FolderLevelPermission[]> {
        return this.listFlps.execute({ where: { type, ...(parentId ? { parentId } : {}) } });
    }
}

export const UserFolderCandidates = Abstraction.createImplementation({
    implementation: AllFoldersCandidatesImpl,
    dependencies: [ListFlpsUseCase]
});
