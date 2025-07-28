import type { ICreateRedirect } from "./ICreateRedirect";
import type { CreateRedirectUseCasesTopics } from "./index";
import type { CreateWbRedirectData } from "~/context/redirects/redirects.types";

export class CreateRedirectWithEvents implements ICreateRedirect {
    private topics: CreateRedirectUseCasesTopics;
    private readonly decoretee: ICreateRedirect;

    constructor(topics: CreateRedirectUseCasesTopics, decoretee: ICreateRedirect) {
        this.topics = topics;
        this.decoretee = decoretee;
    }

    async execute(data: CreateWbRedirectData) {
        await this.topics.onRedirectBeforeCreate.publish({ input: data });
        const redirect = await this.decoretee.execute(data);
        await this.topics.onRedirectAfterCreate.publish({ redirect });
        return redirect;
    }
}
