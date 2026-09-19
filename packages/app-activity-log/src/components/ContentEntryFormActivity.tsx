import React from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { Heading, IconButton } from "@webiny/admin-ui";
import {
    LeftPanel,
    RightPanel,
    SplitView
} from "@webiny/app-admin/components/SplitView/SplitView.js";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ActivityLogAdminFeature } from "~/feature.js";
import { useActivityTimeline } from "~/hooks/useActivityTimeline.js";
import { writeSignature } from "~/timeline/writeSignature.js";
import { ActivityTimelineView } from "./ActivityTimeline.js";

/**
 * The activity panel, beside the form.
 *
 * The design resolved the placement question in favour of a right-hand panel over a tab or a
 * slide-over, for one reason: activity is read *next to* the field it describes, so it has to sit
 * beside the form rather than replace or cover it. `SplitView` is how this codebase already does
 * that — `PreviewDecorator` puts the live preview beside the same form through the same seam — so
 * the panel gets a real resize handle and the form keeps its full width while the panel is closed.
 *
 * Hidden for a new entry: there is no target id yet, so there is nothing to ask about, and asking
 * would produce a `TargetNotFound` on every unsaved form.
 */
export const ContentEntryFormActivity = ContentEntryFormContent.createDecorator(Original => {
    return observer(function ContentEntryFormActivityDecorator(
        props: React.HTMLAttributes<HTMLDivElement> & { width?: string }
    ) {
        const presenter = useContentEntryFormPresenter();
        const { panel } = useFeature(ActivityLogAdminFeature);
        const { entry, model, isNewEntry } = presenter.vm;

        if (isNewEntry || !entry?.entryId || !panel.vm.open) {
            return <Original {...props} />;
        }

        return (
            <SplitView namespace={"cms-activity-log"} className={"h-full"}>
                {/*
                  `width: 100%` and the rounding override follow the live-preview decorator: the
                  form's centred fixed-width column stops making sense once it is one half of a
                  split, and the panel edge should meet it rather than float away from it.
                */}
                <LeftPanel span={8} minSize={30} className={"overflow-y-auto bg-neutral-base"}>
                    <Original {...props} width={"100%"} className={"!pt-0 [&>div]:!rounded-none"} />
                </LeftPanel>
                <RightPanel span={4} minSize={20} className={"overflow-hidden bg-neutral-base"}>
                    <ActivityPanel
                        entryId={entry.entryId}
                        modelId={model.modelId}
                        revision={entry.id}
                        status={entry.meta?.status ?? null}
                        writeToken={writeSignature(entry)}
                        onClose={() => panel.hide()}
                    />
                </RightPanel>
            </SplitView>
        );
    });
});

interface ActivityPanelProps {
    entryId: string;
    modelId: string;
    revision: string;
    status: string | null;
    writeToken: string;
    onClose(): void;
}

/**
 * The panel's own chrome: what it is, how to refresh it, how to close it.
 *
 * The refresh control is not decoration. A save refreshes the timeline by itself, but on a
 * DynamoDB-and-OpenSearch install the read model can lag beyond the automatic retry budget, and
 * refresh is then the difference between waiting and being stuck with a stale panel.
 */
const ActivityPanel = ({
    entryId,
    modelId,
    revision,
    status,
    writeToken,
    onClose
}: ActivityPanelProps) => {
    const timeline = useActivityTimeline({
        targetType: "cms-entry",
        targetId: entryId,
        modelId,
        writeToken,
        currentRevision: revision,
        currentStatus: status
    });

    return (
        <div className={"flex h-full min-h-0 flex-col"}>
            <div
                className={
                    "flex flex-shrink-0 items-center gap-sm border-b-sm border-neutral-dimmed px-sm-extra py-xs"
                }
            >
                <Heading level={6}>Activity</Heading>
                <div className={"ml-auto flex items-center gap-xxs"}>
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        aria-label={"Refresh activity"}
                        icon={<RefreshIcon />}
                        disabled={timeline.loading || timeline.refreshing}
                        onClick={timeline.reload}
                    />
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        aria-label={"Close activity"}
                        icon={<CloseIcon />}
                        onClick={onClose}
                    />
                </div>
            </div>

            <div className={"min-h-0 flex-1"}>
                <ActivityTimelineView {...timeline} />
            </div>
        </div>
    );
};
