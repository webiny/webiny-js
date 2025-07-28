import type { IMoveRedirect } from "./IMoveRedirect";
import type {
    MoveWbRedirectParams,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types";

export class MoveRedirect implements IMoveRedirect {
    private readonly moveOperation: WbRedirectsStorageOperations["move"];

    constructor(moveOperation: WbRedirectsStorageOperations["move"]) {
        this.moveOperation = moveOperation;
    }

    async execute(params: MoveWbRedirectParams) {
        await this.moveOperation(params);
    }
}
