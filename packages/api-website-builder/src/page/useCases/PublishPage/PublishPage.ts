import type { IPublishPage } from "./IPublishPage";
import type { PublishWbPageParams, WbPagesStorageOperations } from "~/page/page.types";

export class PublishPage implements IPublishPage {
    private readonly publishOperation: WbPagesStorageOperations["publish"];

    constructor(publishOperation: WbPagesStorageOperations["publish"]) {
        this.publishOperation = publishOperation;
    }

    async execute(params: PublishWbPageParams) {
        return await this.publishOperation(params);
    }
}
