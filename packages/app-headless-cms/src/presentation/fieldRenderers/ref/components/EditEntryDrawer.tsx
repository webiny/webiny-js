import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Drawer, OverlayLoader, useToast } from "@webiny/admin-ui";
import { DialogsProvider } from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsModelContext } from "~/features/contentEntry/CmsModelContext.js";
import { ContentEntryFormPresenterFeature } from "~/presentation/contentEntries/form/feature.js";
import { EditEntryPresenterFeature } from "../editEntry/feature.js";
import { GenericModelLoader } from "~/presentation/contentEntries/views/GenericModelLoader.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import type { CmsReferenceEntryPatch } from "~/features/contentEntry/refTypes.js";

interface EditEntryDrawerProps {
    modelId: string;
    entryId: string;
    onClose: () => void;
    onSaved: (patch: CmsReferenceEntryPatch) => void;
}

/**
 * Maps a saved content entry to a partial reference-entry patch, so the parent card can be
 * updated in memory (title, status, revision, ...) without refetching from the API.
 */
const toReferenceEntryPatch = (entry: CmsContentEntry): CmsReferenceEntryPatch => ({
    entryId: entry.entryId,
    id: entry.id,
    status: entry.meta.status,
    title: entry.meta.title,
    description: entry.meta.description ?? null,
    image: entry.meta.image ?? null,
    savedOn: entry.savedOn,
    modifiedBy: entry.modifiedBy
});

export const EditEntryDrawer = ({ modelId, entryId, onClose, onSaved }: EditEntryDrawerProps) => {
    const parentContainer = useContainer();

    const dialogContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        ContentEntryFeature.register(child);
        child.register(CmsModelContext).inSingletonScope();
        ContentEntryFormPresenterFeature.register(child);
        EditEntryPresenterFeature.register(child);
        return child;
    }, [modelId]);

    return (
        <DiContainerProvider container={dialogContainer}>
            <DialogsProvider>
                <GenericModelLoader modelId={modelId}>
                    {model => (
                        <EditEntryDrawerContent
                            model={model}
                            entryId={entryId}
                            onClose={onClose}
                            onSaved={onSaved}
                        />
                    )}
                </GenericModelLoader>
            </DialogsProvider>
        </DiContainerProvider>
    );
};

interface EditEntryDrawerContentProps {
    model: CmsModel;
    entryId: string;
    onClose: () => void;
    onSaved: (patch: CmsReferenceEntryPatch) => void;
}

const EditEntryDrawerContent = observer(
    ({ model, entryId, onClose, onSaved }: EditEntryDrawerContentProps) => {
        const { presenter } = useFeature(EditEntryPresenterFeature);
        const { showSuccessToast } = useToast();

        useEffect(() => {
            presenter.init(entryId);
            return () => presenter.dispose();
        }, [entryId]);

        const onSave = useCallback(async () => {
            const saved = await presenter.form.saveRevision({ skipValidation: false });
            const savedEntry = presenter.form.vm.entry;
            if (saved && savedEntry) {
                // Patch the parent card in memory from the saved entry (no refetch). This is a
                // pure MobX state update — it does not flip any loading flag, so there is no
                // overlay flash behind the still-open drawer. The drawer stays open so the
                // editor can keep editing.
                onSaved(toReferenceEntryPatch(savedEntry));
                showSuccessToast({ title: `"${savedEntry.meta.title}" saved successfully.` });
            }
        }, [onSaved, showSuccessToast]);

        const vm = presenter.form.vm;

        return (
            <Drawer
                open={true}
                onClose={onClose}
                width={1000}
                modal={true}
                headerSeparator={true}
                footerSeparator={true}
                bodyPadding={false}
                title={vm.entry?.meta?.title || `Edit ${model.name} Entry`}
                actions={
                    <>
                        <Drawer.CancelButton />
                        <Drawer.ConfirmButton onClick={onSave} text="Save" />
                    </>
                }
            >
                <div className={"p-md relative h-full min-h-[60vh]"}>
                    {vm.loading ? <OverlayLoader text={"Loading entry..."} /> : null}
                    {vm.form ? <FormView name="EditRefEntryForm" form={vm.form} /> : null}
                </div>
            </Drawer>
        );
    }
);
