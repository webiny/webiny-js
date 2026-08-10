import { WebhookFactory as WebhookFactoryAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeWebhookEvent } from "./constants.js";

const themeEvent = (eventName: ThemeWebhookEvent, label: string) => ({
    app: "theme",
    appLabel: "Theme",
    entity: "theme",
    entityLabel: "Themes",
    eventName,
    label
});

class ThemeWebhookFactoryImpl implements WebhookFactoryAbstraction.Interface {
    public async execute(): Promise<WebhookFactoryAbstraction.Definition[]> {
        return [
            themeEvent(ThemeWebhookEvent.ThemeCreated, "Created"),
            themeEvent(ThemeWebhookEvent.ThemeUpdated, "Updated"),
            themeEvent(ThemeWebhookEvent.ThemeDeleted, "Deleted"),
            themeEvent(ThemeWebhookEvent.ThemePublished, "Published")
        ];
    }
}

export const ThemeWebhookFactory = WebhookFactoryAbstraction.createImplementation({
    implementation: ThemeWebhookFactoryImpl,
    dependencies: []
});
