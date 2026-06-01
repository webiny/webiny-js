import React from "react";
import { observer } from "mobx-react-lite";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useContentEntryFormPresenter } from "./ContentEntryFormPresenterProvider.js";

export const ContentEntryFormView = observer(() => {
    const { vm, actions } = useContentEntryFormPresenter();

    if (vm.loading) {
        return <div>{vm.loading}</div>;
    }

    if (!vm.form) {
        return null;
    }

    return (
        <div>
            <ContentEntryFormHeader />
            {vm.activeTab === "content" ? (
                <FormView name="ContentEntryForm" form={vm.form} />
            ) : (
                <ContentEntryRevisionsList />
            )}
        </div>
    );
});

const ContentEntryFormHeader = observer(() => {
    const { vm, actions } = useContentEntryFormPresenter();

    return (
        <div>
            {vm.canSave && (
                <button onClick={() => actions.save()} disabled={vm.loading !== null}>
                    Save
                </button>
            )}
            {vm.canPublish && (
                <button onClick={() => actions.publish()} disabled={vm.loading !== null}>
                    Publish
                </button>
            )}
            {vm.canUnpublish && (
                <button onClick={() => actions.unpublish()} disabled={vm.loading !== null}>
                    Unpublish
                </button>
            )}
            {vm.canCreateRevision && (
                <button onClick={() => actions.createRevision()} disabled={vm.loading !== null}>
                    New Revision
                </button>
            )}
        </div>
    );
});

const ContentEntryRevisionsList = observer(() => {
    const { vm, actions } = useContentEntryFormPresenter();

    return (
        <div>
            {vm.revisions.map(revision => (
                <div key={revision.id}>
                    <span>v{revision.meta.version}</span>
                    <span>{revision.meta.status}</span>
                    <button onClick={() => actions.switchRevision(revision.id)}>
                        {revision.id === vm.entry?.id ? "Current" : "Switch"}
                    </button>
                </div>
            ))}
        </div>
    );
});
