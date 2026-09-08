import React from "react";
import { Alert } from "webiny/admin/ui";
import { Button } from "webiny/admin/ui";
import { Dialog } from "webiny/admin/ui";
import { Text } from "webiny/admin/ui";
import type { IReportBugOutcomeVm } from "./abstractions.js";

interface IOutcomeDialogProps {
    outcome: IReportBugOutcomeVm;
    open: boolean;
    onClose: () => void;
}

/*
 * `compose` opens GitHub on a click rather than on its own. A pop-up opened after an await has
 * lost its user activation and gets blocked, and the reporter has to read the paste reminder
 * before they submit anyway.
 */
export const OutcomeDialog = ({ outcome, open, onClose }: IOutcomeDialogProps) => {
    if (outcome.mode === "filed") {
        return (
            <Dialog
                open={open}
                onOpenChange={onClose}
                title={"Issue filed"}
                actions={<Button variant={"primary"} text={"Done"} onClick={onClose} />}
            >
                <div className={"flex flex-col gap-sm"}>
                    <Text>{"Thanks. The report is on GitHub with everything attached."}</Text>
                    <a
                        href={outcome.url}
                        target={"_blank"}
                        rel={"noreferrer"}
                        className={"text-accent-primary underline"}
                    >
                        {outcome.url}
                    </a>
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onClose}
            title={"Ready to submit"}
            actions={
                <>
                    <Button variant={"ghost"} text={"Close"} onClick={onClose} />
                    <Button
                        variant={"primary"}
                        text={"Open GitHub"}
                        onClick={() => {
                            window.open(outcome.url, "_blank", "noreferrer");
                            onClose();
                        }}
                    />
                </>
            }
        >
            <div className={"flex flex-col gap-md"}>
                <Text>
                    {
                        "This environment has no GitHub token, so the report is written up but not filed. Open GitHub and it will be waiting there, filled in, under your own account."
                    }
                </Text>

                {outcome.remindToPasteScreenshot ? (
                    <Alert type={"warning"} title={"Paste your screenshot there"}>
                        {
                            "Images cannot be carried in a URL, so your screenshot did not come along. It should still be on your clipboard: paste it into the issue before submitting."
                        }
                    </Alert>
                ) : null}
            </div>
        </Dialog>
    );
};
