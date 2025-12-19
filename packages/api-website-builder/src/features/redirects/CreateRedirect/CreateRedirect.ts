import type { ICreateRedirect } from "./ICreateRedirect.js";
import type {
    CreateWbRedirectData,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types.js";

export class CreateRedirect implements ICreateRedirect {
    private readonly createOperation: WbRedirectsStorageOperations["create"];

    constructor(createOperation: WbRedirectsStorageOperations["create"]) {
        this.createOperation = createOperation;
    }

    async execute(data: CreateWbRedirectData) {
        return await this.createOperation({ data });
    }
}
