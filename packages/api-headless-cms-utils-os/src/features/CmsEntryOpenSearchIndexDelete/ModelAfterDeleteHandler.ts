import {
    ModelAfterDeleteEventHandler,
    type ModelAfterDeleteEvent
} from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { CmsEntryOpenSearchIndexDelete } from "./abstractions.js";

class ModelAfterDeleteHandlerImpl implements ModelAfterDeleteEventHandler.Interface {
    constructor(private indexDelete: CmsEntryOpenSearchIndexDelete.Interface) {}

    async handle(event: ModelAfterDeleteEvent) {
        const { model } = event.payload;
        await this.indexDelete.execute({ model });
    }
}

export const ModelAfterDeleteHandler = ModelAfterDeleteEventHandler.createImplementation({
    implementation: ModelAfterDeleteHandlerImpl,
    dependencies: [CmsEntryOpenSearchIndexDelete]
});
