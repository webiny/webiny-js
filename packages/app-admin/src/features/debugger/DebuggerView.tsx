import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui/Alert/index.js";
import { Button } from "@webiny/admin-ui/Button/index.js";
import { Switch } from "@webiny/admin-ui/Switch/index.js";
import { debuggerStore } from "./DebuggerStore.js";

const buildReport = () => {
    return {
        generatedAt: new Date().toISOString(),
        namespaces: debuggerStore.namespaces,
        sessions: debuggerStore.sessions
    };
};

/**
 * Hands the collected sessions to the user as a file.
 *
 * Nothing is uploaded anywhere. The report leaves the browser only when the person chooses to send
 * it, which is the moment they decide this data may leave their organisation.
 */
const downloadReport = () => {
    const blob = new Blob([JSON.stringify(buildReport(), null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `webiny-debug-${new Date().toISOString()}.json`;
    link.click();

    URL.revokeObjectURL(url);
};

export const DebuggerView = observer(() => {
    const onToggle = useCallback((checked: boolean) => {
        debuggerStore.setEnabled(checked);
    }, []);

    const onNamespacesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        debuggerStore.setNamespaces(event.target.value);
    }, []);

    const hasSessions = debuggerStore.sessions.length > 0;

    return (
        <div className={"flex flex-col gap-lg p-lg"}>
            {debuggerStore.enabled ? (
                <Alert type={"warning"}>
                    Debug capture is on. Responses include internal diagnostic data, which may
                    contain content from your records. Turn it off when you are done.
                </Alert>
            ) : null}

            <Switch
                label={"Capture debug data"}
                checked={debuggerStore.enabled}
                onChange={onToggle}
                note={
                    "Reproduce the problem with this on, then download the report and send it to " +
                    "support."
                }
            />

            <label className={"flex flex-col gap-xs"}>
                <span>Namespaces</span>
                <input
                    type={"text"}
                    className={"border rounded-md p-sm"}
                    value={debuggerStore.namespaces}
                    onChange={onNamespacesChange}
                />
                <span className={"text-sm"}>
                    Leave as * to capture everything, or narrow it down - for example cms.os.*
                </span>
            </label>

            {debuggerStore.denied ? (
                <Alert type={"info"}>
                    Debug capture is not available for your account. Ask an administrator to grant
                    the Debugger permission.
                </Alert>
            ) : null}

            <div className={"flex gap-sm items-center"}>
                <span>
                    {debuggerStore.sessions.length} responses collected, {debuggerStore.entryCount}{" "}
                    entries
                </span>
                <Button text={"Download report"} onClick={downloadReport} disabled={!hasSessions} />
                <Button
                    variant={"secondary"}
                    text={"Clear"}
                    onClick={debuggerStore.clear}
                    disabled={!hasSessions}
                />
            </div>
        </div>
    );
});
