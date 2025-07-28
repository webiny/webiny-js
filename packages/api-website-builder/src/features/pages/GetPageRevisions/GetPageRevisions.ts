import type { WbPagesStorageOperations } from "~/context/pages/pages.types";
import type { IGetPageRevisions } from "./IGetPageById";

export class GetPageRevisions implements IGetPageRevisions {
    private readonly getRevisions: WbPagesStorageOperations["getRevisions"];

    constructor(getRevisions: WbPagesStorageOperations["getRevisions"]) {
        this.getRevisions = getRevisions;
    }

    async execute(pageId: string) {
        return await this.getRevisions(pageId);
    }
}
