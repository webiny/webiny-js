import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useContainer, useFeature } from "@webiny/app";
import { Heading, IconButton } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/feature.js";
import { RuleEvaluator } from "@webiny/app-admin/features/formModel/abstractions.js";
import { hiddenFieldIds, type PermissionedField } from "~/admin/timeline/fieldPermissions.js";
import { ActivityLogAdminFeature } from "~/admin/feature.js";
import { useActivityTimeline } from "~/admin/hooks/useActivityTimeline.js";
import { writeSignature } from "~/admin/timeline/writeSignature.js";
import { ActivityTimelineView } from "./ActivityTimeline.js";
import { ActivityFilterToggle } from "./ActivityTimelineFilters.js";
import { TYPE } from "./typeScale.js";

/**
 * The activity panel, beside the form.
 *
 * The design resolved the placement question in favour of a right-hand panel over a tab or a
 * slide-over, for one reason: activity is read *next to* the field it describes, so it has to sit
 * beside the form rather than replace or cover it.
 *
 * It opens the way the comments drawer opens, and that is the point rather than a coincidence:
 * these are two ways of talking about the same entry, and a reader switching between them should
 * not have to learn two behaviours. It began as a `SplitView` with a resize handle, which was
 * defensible on its own and wrong beside a drawer that neither resizes nor is draggable.
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
        const { presenter: revisions } = useFeature(RevisionsListFeature);
        const container = useContainer();
        const hasOpened = React.useRef(false);
        const { entry, model, isNewEntry } = presenter.vm;

        /*
          Which revision is published, and which are drafts.

          Read from the form's own revision list rather than fetched: the revision selector in the
          header has already loaded it, and it is a singleton, so the timeline gets per-revision
          status without adding a query. Without it the panel could only label the revision being
          viewed — a reader on a draft could not see which revision was live, which is the one
          thing the label is for.
        */
        const revisionStatuses = React.useMemo(() => {
            const statuses: Record<string, string> = {};

            for (const revision of revisions.vm.revisions) {
                if (revision.meta?.status) {
                    statuses[revision.id] = revision.meta.status;
                }
            }

            return statuses;
        }, [revisions.vm.revisions]);

        /*
          The fields this reader has no access to.

          Asked the same way the form beside the panel asks it — the CMS's own rule evaluators,
          against the same rules stored on the model's fields — so the timeline and the form can
          never disagree about who may see what. The evaluator is a `TODO` returning false today,
          so this is empty for everyone; when the CMS implements it, the timeline follows without
          a change here.

          `evaluate` takes the form the rule is being evaluated against. An access-control rule is
          about the identity rather than the form's values, and the CMS's evaluator ignores the
          argument, so the entry form is passed when there is one.
        */
        const hiddenFields = React.useMemo(() => {
            const evaluators = container.resolveAll(RuleEvaluator);

            return hiddenFieldIds((model?.fields ?? []) as PermissionedField[], rule => {
                const evaluator = evaluators.find(candidate =>
                    candidate.canEvaluate(rule as never)
                );

                return evaluator
                    ? evaluator.evaluate(rule as never, presenter.vm.form as never)
                    : false;
            });
        }, [container, model, presenter.vm.form]);

        if (isNewEntry || !entry?.entryId) {
            return <Original {...props} />;
        }

        const open = panel.vm.open;

        /*
          The same shape the comments drawer uses, so the two read as one feature rather than two
          that happen to sit on the same screen: a flex row whose second column animates between
          0 and 384px while the panel inside it slides and fades. The form reflows rather than
          being resized, which is why it needs none of the width and rounding overrides a split
          view required.

          Mounted from the first time it is opened, not before and not again after. The panel
          fetches on mount, and fetching an entry's history for every entry anyone opens would put
          the feature's most expensive read on a screen nobody asked it for — so the cost still
          waits for a deliberate click. Keeping it mounted afterwards is what lets the drawer
          animate closed instead of vanishing.
        */
        if (open && !hasOpened.current) {
            hasOpened.current = true;
        }

        return (
            <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
                <div style={{ flex: "1 1 0", minWidth: 0, overflowY: "auto" }}>
                    <Original {...props} />
                </div>
                <div
                    style={{
                        flex: "0 0 auto",
                        width: open ? 384 : 0,
                        height: "100%",
                        overflow: "hidden",
                        transition: "width .22s ease",
                        willChange: "width"
                    }}
                >
                    <div
                        style={{
                            width: 384,
                            height: "100%",
                            opacity: open ? 1 : 0,
                            transform: open ? "translateX(0)" : "translateX(24px)",
                            transition: "opacity .22s ease, transform .22s ease"
                        }}
                    >
                        {hasOpened.current ? (
                            <ActivityPanel
                                entryId={entry.entryId}
                                modelId={model.modelId}
                                revision={entry.id}
                                status={entry.meta?.status ?? null}
                                revisionStatuses={revisionStatuses}
                                hiddenFields={hiddenFields}
                                writeToken={writeSignature(entry)}
                                onClose={() => panel.hide()}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        );
    });
});

interface ActivityPanelProps {
    entryId: string;
    modelId: string;
    revision: string;
    status: string | null;
    revisionStatuses: Record<string, string>;
    /** Fields this reader has no access to, withheld from the timeline the way the form withholds them. */
    hiddenFields: Set<string>;
    writeToken: string;
    onClose(): void;
}

/**
 * The panel's own chrome: what it is, how to refresh it, how to close it.
 *
 * An `aside` with its own surface and a hairline down its left edge, which is what the comments
 * drawer is — the border is the only thing separating the panel from the form, since both sit on
 * the same white, and without it the timeline reads as a column of the form rather than a thing
 * beside it. It runs the full height because the element is `h-full` inside a column the decorator
 * holds at the viewport's height: the form scrolls within its own column, so the edge stays put
 * rather than scrolling away with the fields.
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
    revisionStatuses,
    hiddenFields,
    writeToken,
    onClose
}: ActivityPanelProps) => {
    const timeline = useActivityTimeline({
        targetType: "cms-entry",
        targetId: entryId,
        modelId,
        writeToken,
        currentRevision: revision,
        currentStatus: status,
        revisionStatuses,
        hiddenFields
    });

    /**
     * Whether the filter bar is showing. Here rather than in the timeline because the button that
     * opens it lives in the panel's chrome and the bar it opens lives below — one piece of state
     * with two readers, so it belongs to the thing that contains both.
     */
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filterCount = (timeline.filters.revision ? 1 : 0) + (timeline.filters.actorId ? 1 : 0);

    return (
        <aside
            className={
                "flex h-full min-h-0 flex-col border-l-sm border-neutral-dimmed bg-neutral-base"
            }
        >
            {/*
              `14px 16px 12px`, which is the comments header's padding rather than a tidier pair.
              It is what puts the two titles on the same baseline when both drawers are open, and
              two drawers whose headers are nine pixels out of line is the kind of thing a reader
              notices without being able to say why.
            */}
            <div
                className={
                    "flex flex-shrink-0 items-center gap-sm border-b-sm border-neutral-dimmed px-md pt-[14px] pb-[12px]"
                }
            >
                <Heading level={6} className={TYPE.title}>
                    Activity
                </Heading>
                {/*
                  Filter, refresh and close as one group, which is where the design puts the
                  controls: reached for rather than read, and out of the way of the timeline. What
                  stays below is only the applied state — the summary line and a chip per filter.
                */}
                {/*
                  `[&>span]:flex` because `Button` and `IconButton` each wrap themselves in an
                  `inline-block` span, and an inline box reserves a descender below its content —
                  one pixel, which the row then inherits and hands to the header. It is the last
                  pixel between this header and the comments one.
                */}
                <div className={"ml-auto flex items-center gap-xxs [&>span]:flex"}>
                    <ActivityFilterToggle
                        open={filtersOpen}
                        count={filterCount}
                        onToggle={() => setFiltersOpen(open => !open)}
                    />
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
                <ActivityTimelineView {...timeline} filtersOpen={filtersOpen} />
            </div>
        </aside>
    );
};
