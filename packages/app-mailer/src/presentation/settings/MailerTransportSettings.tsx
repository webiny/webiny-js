import { makeDecoratable } from "@webiny/app-admin";

/**
 * Where transport packages put their settings form, above the test email. Empty by default: a
 * transport configured in code (environment variables, a project extension) has nothing to edit
 * here. To add a form, decorate it and render `Original` alongside, so other transports keep theirs.
 */
export const MailerTransportSettings = makeDecoratable("MailerTransportSettings", () => {
    return null;
});
