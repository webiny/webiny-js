import React from "react";
import { useContainer, useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/feature.js";
import { RuleEvaluator } from "@webiny/app-admin/features/formModel/abstractions.js";
import { hiddenFieldIds, type PermissionedField } from "~/admin/timeline/fieldPermissions.js";
import { ActivityLogAdminFeature } from "~/admin/feature.js";
import { ActivityPanel } from "./ActivityPanel.js";
import { writeSignature } from "~/admin/timeline/writeSignature.js";

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
    return createReactiveComponent(function ContentEntryFormActivityDecorator(
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
