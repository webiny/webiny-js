import { type IScheduledAction, ScheduledActionHandler } from "~/shared/abstractions.js";

/**
 * Handler for publishing CMS entries
 *
 * Handles the "Publish" action for CMS entries with namespace pattern: Cms/Entry/{modelId}
 *
 * Publishing logic:
 * 1. If entry is not published -> publish it
 * 2. If the same revision is already published -> republish it
 * 3. If a different revision is published -> unpublish old, publish new
 */
export class PublishTestEntryActionHandlerImpl implements ScheduledActionHandler.Interface {
    public static name: string = "Test/SomeCustomEntry";

    public canHandle(namespace: string, actionType: string): boolean {
        if (namespace !== PublishTestEntryActionHandlerImpl.name) {
            return false;
        } else if (actionType !== "Publish") {
            return false;
        }
        return true;
    }

    public async handle(action: IScheduledAction): Promise<void> {
        console.log({
            publishing: action
        });
    }
}

export const PublishTestEntryActionHandler = ScheduledActionHandler.createImplementation({
    implementation: PublishTestEntryActionHandlerImpl,
    dependencies: []
});
