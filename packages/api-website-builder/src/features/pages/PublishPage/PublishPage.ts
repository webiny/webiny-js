import type { IPublishPage } from "./IPublishPage";
import type { PublishWbPageParams, WbPagesStorageOperations } from "~/context/pages/pages.types";

export class PublishPage implements IPublishPage {
    private readonly publishOperation: WbPagesStorageOperations["publish"];

    constructor(publishOperation: WbPagesStorageOperations["publish"]) {
        this.publishOperation = publishOperation;
    }

    async execute(params: PublishWbPageParams) {
        return await this.publishOperation(params);
    }
}
