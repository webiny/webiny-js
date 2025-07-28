import type { ICreateRedirect } from "./ICreateRedirect";
import type { CreateWbRedirectData, WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";

export class CreateRevision implements ICreateRedirect {
    private readonly createOperation: WbRedirectsStorageOperations["create"];

    constructor(createOperation: WbRedirectsStorageOperations["create"]) {
        this.createOperation = createOperation;
    }

    async execute(data: CreateWbRedirectData) {
        return await this.createOperation({ data });
    }
}
