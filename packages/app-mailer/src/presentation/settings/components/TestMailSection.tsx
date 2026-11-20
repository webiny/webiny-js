import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { SimpleForm } from "@webiny/app-admin";
import { SimpleFormContent } from "@webiny/app-admin";
import { SimpleFormFooter } from "@webiny/app-admin";
import { SimpleFormHeader } from "@webiny/app-admin";
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
        resultAlert = <Alert type={testMail.result.type}>{testMail.result.message}</Alert>;
    }

    return (
        <SimpleForm>
            <SimpleFormHeader title={"Send a test email"} />
            <SimpleFormContent>
                <div className={"flex flex-col gap-md"}>
                    <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                        Sends one message through the saved settings. A configured mailer can still
                        fail to deliver, and this is where you find out.
                    </Text>
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
                            size={"lg"}
                            onClick={() => presenter.sendTestMail()}
                            disabled={testMail.sending || testMail.disabledReason !== null}
                        />
                    </div>
                    {disabledNote}
                    {resultAlert}
                </div>
            </SimpleFormContent>
            <SimpleFormFooter>{null}</SimpleFormFooter>
        </SimpleForm>
    );
});
