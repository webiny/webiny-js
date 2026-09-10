import React from "react";
import { observer } from "mobx-react-lite";
import { Heading } from "@webiny/admin-ui";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { writeSignature } from "~/timeline/writeSignature.js";
import { ActivityTimeline } from "./ActivityTimeline.js";

/**
 * Puts the timeline on the entry form.
 *
 * A decorator over the form content, following `ContentEntryFormWorkflow` — there is no sidebar
 * slot on the entry form today. Layout is exactly what the design handover will replace, so this
 * is deliberately the plainest arrangement that works.
 *
 * Hidden for a new entry: there is no target id yet, so there is nothing to ask about. Asking
 * would produce a `TargetNotFound` on every unsaved form.
 *
 * The write signature is what makes the timeline refresh on save. The form replaces its own entry
 * with the one the mutation returned, so a save, a publish, an unpublish and a new revision all
 * change this value — and the observer re-renders with it.
 */
export const ContentEntryFormActivity = ContentEntryFormContent.createDecorator(Original => {
    return observer(function ContentEntryFormActivityDecorator(props) {
        const presenter = useContentEntryFormPresenter();
        const { entry, model, isNewEntry } = presenter.vm;

        if (isNewEntry || !entry?.entryId) {
            return <Original {...props} />;
        }

        return (
            <>
                <Original {...props} />
                <div className={"p-md border-solid border-t-sm border-neutral-dimmed"}>
                    <Heading level={5} className={"mb-sm"}>
                        Activity
                    </Heading>
                    <ActivityTimeline
                        targetType={"cms-entry"}
                        targetId={entry.entryId}
                        modelId={model.modelId}
                        writeToken={writeSignature(entry)}
                    />
                </div>
            </>
        );
    });
});
