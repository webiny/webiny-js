import React from "react";
import { createReactiveComponent } from "webiny/admin";
import { useFeature } from "webiny/admin";
import { Alert } from "webiny/admin/ui";
import { Button } from "webiny/admin/ui";
import { Dialog } from "webiny/admin/ui";
import { Text } from "webiny/admin/ui";
import { Textarea } from "webiny/admin/ui";
import { ReactComponent as MicIcon } from "webiny/admin/icons/mic.svg";
import { ReactComponent as MicOffIcon } from "webiny/admin/icons/mic_off.svg";
import { BugReportFeature } from "../../feature.js";

const PLACEHOLDER = "Hey, this isn't working...";

export const ReportBugDialog = createReactiveComponent(function ReportBugDialog() {
    const { report } = useFeature(BugReportFeature);
    const { vm } = report;

    if (vm.issueUrl) {
        return (
            <Dialog
                open={vm.open}
                onOpenChange={() => report.close()}
                title={"Issue filed"}
                actions={
                    <Button variant={"primary"} text={"Done"} onClick={() => report.close()} />
                }
            >
                <div className={"flex flex-col gap-sm"}>
                    <Text>{"Thanks. The report is on GitHub with everything attached."}</Text>
                    <a
                        href={vm.issueUrl}
                        target={"_blank"}
                        rel={"noreferrer"}
                        className={"text-accent-primary underline"}
                    >
                        {vm.issueUrl}
                    </a>
                </div>
            </Dialog>
        );
    }

    const micLabel = vm.listening ? "Stop dictating" : "Dictate";
    const micIcon = vm.listening ? <MicOffIcon /> : <MicIcon />;

    return (
        <Dialog
            open={vm.open}
            onOpenChange={() => report.close()}
            title={"Report a bug"}
            description={"Say what went wrong. The rest is already captured."}
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

                {vm.screenshot ? (
                    <div className={"flex flex-col gap-sm"}>
                        <img
                            src={vm.screenshot}
                            alt={"Screenshot taken when the report was opened"}
                            className={
                                "max-h-64 w-full rounded-md border-sm border-neutral-muted object-contain"
                            }
                        />
                        <div className={"flex gap-sm"}>
                            <Button
                                variant={"ghost"}
                                size={"sm"}
                                text={"Retake"}
                                onClick={() => void report.retakeScreenshot()}
                            />
                            <Button
                                variant={"ghost"}
                                size={"sm"}
                                text={"Remove"}
                                onClick={() => report.discardScreenshot()}
                            />
                        </div>
                    </div>
                ) : (
                    <Button
                        variant={"secondary"}
                        size={"sm"}
                        text={"Attach a screenshot"}
                        onClick={() => void report.retakeScreenshot()}
                    />
                )}

                <Text size={"sm"}>
                    {`${vm.recordedEventCount} recorded actions will be attached.`}
                </Text>

                {vm.statusLabel ? <Text size={"sm"}>{vm.statusLabel}</Text> : null}
            </div>
        </Dialog>
    );
});
