export enum ThemeWebhookEvent {
    ThemeCreated = "theme.created",
    ThemeUpdated = "theme.updated",
    ThemeDeleted = "theme.deleted",
    ThemePublished = "theme.published"
    // No activation/deactivation events: delivery serves the active version at a stable URL with a
    // short TTL, so there is nothing for a frontend to revalidate and no webhook to wire (C8).
}
