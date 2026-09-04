import React, { useEffect } from "react";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { Dialog } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { AiEnrichmentFeature } from "./feature.js";
import { StreamingPlaceholder } from "./StreamingPlaceholder.js";

const { FileDetails } = FileManagerViewConfig;

/**
 * Test-bed for HTTP response streaming: re-runs AI enrichment for the open file and renders the
 * model's output as it arrives, rather than waiting for the whole response.
 *
 * The stream only PROPOSES. Save drops the values into the file details form as pending edits; the
 * file is written when the user presses Update in the drawer, exactly as for a hand-typed edit.
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
                            text={"Apply"}
                            onClick={() => presenter.accept()}
                            disabled={!vm.canSave}
                        />
                    </>
                }
            >
                <div className={"flex flex-col gap-md"}>
                    {/*
                     * Each value box reserves its space so the dialog doesn't resize while the model
                     * streams, and the footer buttons don't slide out from under the pointer.
                     *
                     * On the value boxes rather than once on the body: tags and description grow
                     * independently, so a single body minimum would still let wrapping tags shove the
                     * description down. The reservations cover what this prompt ("up to 5 tags and one
                     * short sentence") actually produces — two rows of chips, four lines of text.
                     * Beyond that the dialog grows, which beats clipping.
                     */}
                    <div>
                        <div className={"text-sm font-semibold mb-xs"}>{"Tags"}</div>
                        <div className={"min-h-[48px]"}>
                            {vm.tags.length ? (
                                <div className={"flex flex-wrap gap-xs"}>
                                    {vm.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className={
                                                "text-sm px-sm py-xxs rounded bg-neutral-dimmed"
                                            }
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <StreamingPlaceholder loading={vm.loading} variant={"chips"} />
                            )}
                        </div>
                    </div>
                    <div>
                        <div className={"text-sm font-semibold mb-xs"}>{"Description"}</div>
                        {/*
                         * `lh` is the line-height unit, so four lines stays four lines if the type
                         * scale changes. Browsers without it simply ignore the minimum.
                         */}
                        <div className={"text-sm min-h-[4lh]"}>
                            {vm.description ? (
                                vm.description
                            ) : (
                                <StreamingPlaceholder loading={vm.loading} variant={"text"} />
                            )}
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
});
