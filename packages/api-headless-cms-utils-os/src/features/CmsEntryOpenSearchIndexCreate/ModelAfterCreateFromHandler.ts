import {
    ModelAfterCreateFromEventHandler,
    type ModelAfterCreateFromEvent
} from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { CmsEntryOpenSearchIndexCreate } from "./abstractions.js";

class ModelAfterCreateFromHandlerImpl implements ModelAfterCreateFromEventHandler.Interface {
    constructor(private indexCreate: CmsEntryOpenSearchIndexCreate.Interface) {}

    async handle(event: ModelAfterCreateFromEvent) {
        const { model } = event.payload;
        await this.indexCreate.execute({ model });
    }
}

export const ModelAfterCreateFromHandler = ModelAfterCreateFromEventHandler.createImplementation({
    implementation: ModelAfterCreateFromHandlerImpl,
    dependencies: [CmsEntryOpenSearchIndexCreate]
});
