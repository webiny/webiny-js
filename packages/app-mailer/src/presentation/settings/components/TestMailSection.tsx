import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { SettingsPresenterFeature } from "../feature.js";

export const TestMailSection = createReactiveComponent(function TestMailSection() {
    const { presenter } = useFeature(SettingsPresenterFeature);
    const { testMail } = presenter.vm;

    let disabledNote: React.ReactNode = null;
    if (testMail.disabledReason && !testMail.sending) {
        disabledNote = (
            <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                {testMail.disabledReason}
            </Text>
        );
    }

    let resultAlert: React.ReactNode = null;
    if (testMail.result) {
        const title = testMail.result.type === "success" ? "Test email sent" : "Test email failed";
        resultAlert = (
            <Alert type={testMail.result.type} title={title}>
                {testMail.result.message}
            </Alert>
        );
    }

    return (
        <div className={"flex flex-col gap-md"}>
            <Separator />
            <div>
                <Heading level={5}>Send a test email</Heading>
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    Sends one message through the saved settings. A configured mailer can still fail
                    to deliver, and this is where you find out.
                </Text>
            </div>
            <div className={"flex items-end gap-sm"}>
                <Input
                    label={"Recipient"}
                    value={testMail.recipient}
                    onChange={value => presenter.setTestMailRecipient(value)}
                    disabled={testMail.sending}
                />
                <Button
                    text={testMail.sending ? "Sending..." : "Send test email"}
                    variant={"secondary"}
                    onClick={() => presenter.sendTestMail()}
                    disabled={testMail.sending || testMail.disabledReason !== null}
                />
            </div>
            {disabledNote}
            {resultAlert}
        </div>
    );
});
