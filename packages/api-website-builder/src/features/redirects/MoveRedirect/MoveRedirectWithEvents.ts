import type { MoveRedirectUseCasesTopics } from "./index";
import type { MoveWbRedirectParams, WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";
import type { IMoveRedirect } from "~/features/redirects/MoveRedirect/IMoveRedirect";
import { WebinyError } from "@webiny/error";

export class MoveRedirectWithEvents implements IMoveRedirect {
    private topics: MoveRedirectUseCasesTopics;
    private readonly getOperation: WbRedirectsStorageOperations["getById"];
    private readonly decoretee: IMoveRedirect;

    constructor(
        topics: MoveRedirectUseCasesTopics,
        getOperation: WbRedirectsStorageOperations["getById"],
        decoretee: IMoveRedirect
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: MoveWbRedirectParams) {
        const redirect = await this.getOperation(params.id);

        if (!redirect) {
            throw new WebinyError(
                `Redirect with id ${params.id} not found`,
                "MOVE_REDIRECT_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onRedirectBeforeMove.publish({
            redirect,
            folderId: params.folderId
        });
        await this.decoretee.execute(params);
        await this.topics.onRedirectAfterMove.publish({
            redirect,
            folderId: params.folderId
        });
    }
}
