import type { IGetPageByPath } from "./IGetPageByPath";
import type { WbPagesStorageOperations } from "~/context/pages/pages.types";

/**
 * Get published page by path.
 * This use case always returns a published page revision.
 */
export class GetPageByPath implements IGetPageByPath {
    private readonly getOperation: WbPagesStorageOperations["get"];

    constructor(getOperation: WbPagesStorageOperations["get"]) {
        this.getOperation = getOperation;
    }

    async execute(path: string) {
        return await this.getOperation({
            where: {
                properties: {
                    path
                },
                published: true
            }
        });
    }
}
