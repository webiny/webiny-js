import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { GetSettingsFeature } from "./features/getSettings/feature.js";
import { SaveSettingsFeature } from "./features/saveSettings/feature.js";
import { SmtpSettingsPresenterFeature } from "./presentation/SmtpSettings/feature.js";
import { SmtpSettingsDecorator } from "./presentation/SmtpSettings/components/SmtpSettingsDecorator.js";

/*
 * The SMTP form on the Mailer settings screen, which `@webiny/app-mailer` provides along with the
 * route, the menu item and the test email.
 */
export const SmtpSettings = () => {
    return (
        <>
            <RegisterFeature feature={GetSettingsFeature} />
            <RegisterFeature feature={SaveSettingsFeature} />
            <RegisterFeature feature={SmtpSettingsPresenterFeature} />
            <SmtpSettingsDecorator />
        </>
    );
};
