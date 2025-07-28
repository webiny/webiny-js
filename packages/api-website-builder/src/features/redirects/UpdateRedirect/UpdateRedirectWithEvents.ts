import type { IUpdateRedirect } from "./IUpdateRedirect";
import type { UpdateRedirectUseCasesTopics } from "./index";
import type { UpdateWbRedirectData, WbRedirectsStorageOperations } from "~/context/redirects/redirects.types";
import { WebinyError } from "@webiny/error";

export class UpdateRedirectWithEvents implements IUpdateRedirect {
    private topics: UpdateRedirectUseCasesTopics;
    private readonly getOperation: WbRedirectsStorageOperations["getById"];
    private readonly decoretee: IUpdateRedirect;

    constructor(
        topics: UpdateRedirectUseCasesTopics,
        getOperation: WbRedirectsStorageOperations["getById"],
        decoretee: IUpdateRedirect
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(id: string, data: UpdateWbRedirectData) {
        const original = await this.getOperation(id);

        if (!original) {
            throw new WebinyError(`Redirect with id ${id} not found`, "UPDATE_REDIRECT_WITH_EVENTS_ERROR");
        }

        await this.topics.onRedirectBeforeUpdate.publish({
            original,
            input: { id, data }
        });
        const redirect = await this.decoretee.execute(id, data);
        await this.topics.onRedirectAfterUpdate.publish({
            original,
            input: { id, data },
            redirect
        });

        return redirect;
    }
}
