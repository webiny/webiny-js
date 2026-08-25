import {
    ModelAfterCreateEventHandler,
    type ModelAfterCreateEvent
} from "@webiny/api-headless-cms/features/contentModel/CreateModel/events.js";
import { CmsEntryOpenSearchIndexCreate } from "./abstractions.js";

class ModelAfterCreateHandlerImpl implements ModelAfterCreateEventHandler.Interface {
    constructor(private indexCreate: CmsEntryOpenSearchIndexCreate.Interface) {}

    async handle(event: ModelAfterCreateEvent) {
        const { model } = event.payload;
        await this.indexCreate.execute({ model });
    }
}

export const ModelAfterCreateHandler = ModelAfterCreateEventHandler.createImplementation({
    implementation: ModelAfterCreateHandlerImpl,
    dependencies: [CmsEntryOpenSearchIndexCreate]
});
