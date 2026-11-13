import React from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, Heading, Input, Separator, Text } from "@webiny/admin-ui";
import type { ISettingsPresenter } from "../abstractions.js";

interface TestMailSectionProps {
    presenter: ISettingsPresenter;
}

export const TestMailSection = observer(function TestMailSection({
    presenter
}: TestMailSectionProps) {
    const { testMail } = presenter.vm;

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
            {testMail.disabledReason && !testMail.sending ? (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {testMail.disabledReason}
                </Text>
            ) : null}
            {testMail.result ? (
                <Alert
                    type={testMail.result.type}
                    title={
                        testMail.result.type === "success" ? "Test email sent" : "Test email failed"
                    }
                >
                    {testMail.result.message}
                </Alert>
            ) : null}
        </div>
    );
});
