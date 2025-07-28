import { WebinyError } from "@webiny/error";
import type { IDeleteRedirect } from "./IDeleteRedirect";
import { DeleteWbRedirectParams, WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";
import { DeleteRedirectUseCasesTopics } from "~/features/redirects";

export class DeleteRedirectWithEvents implements IDeleteRedirect {
    private topics: DeleteRedirectUseCasesTopics;
    private readonly getOperation: WbRedirectsStorageOperations["getById"];
    private readonly decoretee: IDeleteRedirect;

    constructor(
        topics: DeleteRedirectUseCasesTopics,
        getOperation: WbRedirectsStorageOperations["getById"],
        decoretee: IDeleteRedirect
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: DeleteWbRedirectParams) {
        const redirect = await this.getOperation(params.id);

        if (!redirect) {
            throw new WebinyError(
                `Redirect with id ${params.id} not found`,
                "DELETE_REDIRECT_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onRedirectBeforeDelete.publish({ redirect });
        await this.decoretee.execute(params);
        await this.topics.onRedirectAfterDelete.publish({ redirect });
    }
}
