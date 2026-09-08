import React, { useEffect } from "react";
import { createReactiveComponent } from "webiny/admin";
import { useFeature } from "webiny/admin";
import { Alert } from "webiny/admin/ui";
import { Button } from "webiny/admin/ui";
import { Dialog } from "webiny/admin/ui";
import { IconButton } from "webiny/admin/ui";
import { Text } from "webiny/admin/ui";
import { Textarea } from "webiny/admin/ui";
import { ReactComponent as MicIcon } from "webiny/admin/icons/mic.svg";
import { ReactComponent as MicOffIcon } from "webiny/admin/icons/mic_off.svg";
import { ReactComponent as CloseIcon } from "webiny/admin/icons/close.svg";
import { readPastedImage } from "../../capture/readPastedImage.js";
import { BugReportFeature } from "../../feature.js";
import { OutcomeDialog } from "./OutcomeDialog.js";

const PLACEHOLDER = "Hey, this isn't working...";

export const ReportBugDialog = createReactiveComponent(function ReportBugDialog() {
    const { report } = useFeature(BugReportFeature);
    const { vm } = report;

    /*
     * Paste anywhere in the dialog to attach an image. The listener sits on the document so it
     * works wherever focus is, and only claims the event when the clipboard actually holds an
     * image — otherwise pasted text still lands in the textarea.
     */
    useEffect(() => {
        if (!vm.open) {
            return;
        }

        const onPaste = (event: ClipboardEvent) => {
            void readPastedImage(event).then(dataUrl => {
                if (dataUrl) {
                    report.attachScreenshot(dataUrl);
                }
            });
        };

        document.addEventListener("paste", onPaste);

        return () => {
            document.removeEventListener("paste", onPaste);
        };
    }, [vm.open, report]);

    if (vm.outcome) {
        return <OutcomeDialog outcome={vm.outcome} open={vm.open} onClose={() => report.close()} />;
    }

    const micLabel = vm.listening ? "Stop dictating" : "Dictate";
    const micIcon = vm.listening ? <MicOffIcon /> : <MicIcon />;

    return (
        <Dialog
            open={vm.open}
            onOpenChange={() => report.close()}
            title={"Report a bug"}
            description={"Say what went wrong, paste a screenshot. The rest is already captured."}
            loading={vm.busy}
            actions={
                <>
                    <Button variant={"ghost"} text={"Cancel"} onClick={() => report.close()} />
                    <Button
                        variant={"primary"}
                        text={"File the issue"}
                        disabled={!vm.canSubmit}
                        onClick={() => void report.submit()}
                    />
                </>
            }
        >
            <div className={"flex flex-col gap-md"}>
                {vm.error ? (
                    <Alert type={"danger"} title={"That did not go through"}>
                        {vm.error}
                    </Alert>
                ) : null}

                <Textarea
                    rows={5}
                    autoFocus={true}
                    placeholder={PLACEHOLDER}
                    value={vm.description}
                    onChange={(value: string) => report.describe(value)}
                />

                {vm.dictationSupported ? (
                    <div>
                        <Button
                            variant={"secondary"}
                            size={"sm"}
                            icon={micIcon}
                            text={micLabel}
                            onClick={() => report.toggleDictation()}
                        />
                    </div>
                ) : null}

                {vm.screenshots.length > 0 ? (
                    <div className={"flex flex-wrap gap-sm"}>
                        {vm.screenshots.map((screenshot, index) => (
                            <div key={index} className={"relative"}>
                                <img
                                    src={screenshot}
                                    alt={`Attachment ${index + 1}`}
                                    className={
                                        "h-24 w-40 rounded-md border-sm border-neutral-muted object-cover"
                                    }
                                />
                                <div className={"absolute right-xxs top-xxs"}>
                                    <IconButton
                                        size={"sm"}
                                        variant={"secondary"}
                                        icon={<CloseIcon />}
                                        aria-label={`Remove attachment ${index + 1}`}
                                        onClick={() => report.removeScreenshot(index)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                <Text size={"sm"}>
                    {`Paste a screenshot to attach it. ${vm.recordedEventCount} recorded actions will be included.`}
                </Text>

                {vm.statusLabel ? <Text size={"sm"}>{vm.statusLabel}</Text> : null}
            </div>
        </Dialog>
    );
});
