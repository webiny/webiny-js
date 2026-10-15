import React from "react";
import { useFeature } from "@webiny/app";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Switch } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { DebuggerPresenterFeature } from "../feature.js";

export const DebuggerView = createReactiveComponent(() => {
    const { presenter } = useFeature(DebuggerPresenterFeature);
    const { vm } = presenter;

    if (!vm.available) {
        return (
            <div className={"p-lg"}>
                <Alert type={"info"} variant={"subtle"}>
                    Debug capture needs the Debugger permission (Dev Tools) granted on one of your
                    roles. Dev Tools full access alone is not enough.
                </Alert>
            </div>
        );
    }

    const hasSessions = vm.sessionCount > 0;

    return (
        <div className={"flex flex-col gap-lg p-lg"}>
            {vm.captureOn ? (
                <Alert type={"warning"} variant={"subtle"}>
                    Debug capture is on. Responses include internal diagnostic data, which may
                    contain content from your records. Turn it off when you are done.
                </Alert>
            ) : null}

            <Switch
                label={"Capture debug data"}
                checked={vm.captureOn}
                onChange={presenter.setCaptureOn}
                note={
                    "Reproduce the problem with this on, then download the report and send it to " +
                    "support. Collected data is kept in this tab only."
                }
            />

            <div className={"flex gap-sm items-center"}>
                <Text as={"span"} size={"md"}>
                    {`${vm.sessionCount} responses collected, ${vm.entryCount} entries`}
                </Text>
                <Button
                    text={"Download report"}
                    onClick={presenter.downloadReport}
                    disabled={!hasSessions}
                />
                <Button
                    variant={"secondary"}
                    text={"Clear"}
                    onClick={presenter.clear}
                    disabled={!hasSessions}
                />
            </div>
        </div>
    );
});
