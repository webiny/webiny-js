import React from "react";
import { MailerTransportSettings } from "@webiny/app-mailer";
import { SmtpSettingsView } from "./SmtpSettingsView.js";

export const SmtpSettingsDecorator = MailerTransportSettings.createDecorator(Original => {
    return function MailerTransportSettingsWithSmtp() {
        return (
            <>
                <Original />
                <SmtpSettingsView />
            </>
        );
    };
});
