/**
 * The shortest password the self-hosted identity provider accepts. The API's `passwordPolicy`
 * enforces it, and `<SelfHostedAuth>` bakes it into the admin as `WEBINY_ADMIN_PASSWORD_POLICY`,
 * so the forms and the API agree.
 */
export const MINIMUM_PASSWORD_LENGTH = 8;
