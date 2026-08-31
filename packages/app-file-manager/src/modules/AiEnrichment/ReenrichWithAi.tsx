import React, { useEffect } from "react";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { Dialog } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { AiEnrichmentFeature } from "./feature.js";

const { FileDetails } = FileManagerViewConfig;

/**
 * Test-bed for HTTP response streaming: re-runs AI enrichment for the open file and renders the
 * model's output as it arrives, rather than waiting for the whole response.
 *
 * The stream only PROPOSES: nothing is written until the user presses Save, which puts the values
 * into the file details form and saves it through the file's normal update path.
 */
export const ReenrichWithAi = createReactiveComponent(function ReenrichWithAi() {
    const { file } = useFile();
    const { presenter } = useFeature(AiEnrichmentFeature);
    const { vm } = presenter;

    // Abandon an in-flight stream when this view goes away, so the read loop doesn't keep running
    // against a component that no longer exists.
    useEffect(() => {
        return () => presenter.dispose();
    }, [presenter]);

    return (
        <>
            <FileDetails.Action.Button
                label={"Re-enrich with AI"}
                icon={<AiIcon />}
                onAction={() => presenter.start(file.id)}
                data-testid={"fm.file-details.action.reenrich-with-ai"}
            />
            <Dialog
                open={vm.open}
                onOpenChange={open => presenter.setOpen(open)}
                title={"Re-enrich with AI"}
                description={vm.message}
                actions={
                    <>
                        <Dialog.CancelAction />
                        <Dialog.ConfirmAction
                            text={vm.saving ? "Saving…" : "Save"}
                            onClick={() => presenter.save()}
                            disabled={!vm.canSave}
                        />
                    </>
                }
            >
                <div className={"flex flex-col gap-md"}>
                    <div>
                        <div className={"text-sm font-semibold mb-xs"}>{"Tags"}</div>
                        {vm.tags.length ? (
                            <div className={"flex flex-wrap gap-xs"}>
                                {vm.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className={"text-sm px-sm py-xxs rounded bg-neutral-dimmed"}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className={"text-sm text-neutral-strong"}>{"—"}</div>
                        )}
                    </div>
                    <div>
                        <div className={"text-sm font-semibold mb-xs"}>{"Description"}</div>
                        <div className={"text-sm"}>{vm.description || "—"}</div>
                    </div>
                </div>
            </Dialog>
        </>
    );
});
