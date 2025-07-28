import type { IUpdateRedirect } from "./IUpdateRedirect";
import type {
    UpdateWbRedirectData,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types";

export class UpdateRedirect implements IUpdateRedirect {
    private readonly updateOperation: WbRedirectsStorageOperations["update"];

    constructor(updateOperation: WbRedirectsStorageOperations["update"]) {
        this.updateOperation = updateOperation;
    }

    async execute(id: string, data: UpdateWbRedirectData) {
        return await this.updateOperation({ id, data });
    }
}
