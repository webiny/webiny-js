import React, { useEffect } from "react";
import { CenteredView } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { TestMailPresenterFeature } from "~/presentation/testMail/feature.js";
import { TestMailSection } from "~/presentation/testMail/TestMailSection.js";
import { MailerTransportSettings } from "./MailerTransportSettings.js";

export const SettingsView = () => {
    const { presenter } = useFeature(TestMailPresenterFeature);

    useEffect(() => {
        presenter.init();
        return () => presenter.dispose();
    }, [presenter]);

    return (
        <CenteredView>
            <MailerTransportSettings />
            {/*
             * Below the settings rather than inside them: the section's note and result appear and
             * disappear as a form turns dirty, which happens when a field loses focus. Above a
             * Save button, that moved Save between mouse down and mouse up, and the click was lost.
             */}
            <TestMailSection />
        </CenteredView>
    );
};
