export enum ThemeWebhookEvent {
    ThemeCreated = "theme.created",
    ThemeUpdated = "theme.updated",
    ThemeDeleted = "theme.deleted",
    ThemePublished = "theme.published",
    /**
     * The one that matters for delivery. A customer wires this to the SDK's revalidation handler so
     * their frontend drops cached pages for the tenant.
     */
    ThemeActivated = "theme.activated",
    ThemeDeactivated = "theme.deactivated"
}
