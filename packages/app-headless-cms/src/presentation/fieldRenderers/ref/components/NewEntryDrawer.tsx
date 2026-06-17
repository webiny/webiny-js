import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Drawer, OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { FoldersFeature } from "@webiny/app-aco/features/folders/feature.js";
import { FolderTreePresenterFeature } from "@webiny/app-aco/presentation/folderTree/feature.js";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { CmsModelAccessor } from "~/features/contentEntry/CmsModelAccessor.js";
import { ContentEntryFormPresenterFeature } from "~/presentation/contentEntries/form/feature.js";
import { GenericModelLoader } from "~/presentation/contentEntries/views/GenericModelLoader.js";
import type { CmsModel } from "~/types.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

interface NewEntryDrawerProps {
    modelId: string;
    onClose: () => void;
    onChange: (value: CmsReferenceValue) => void;
}

export const NewEntryDrawer = ({ modelId, onClose, onChange }: NewEntryDrawerProps) => {
    const parentContainer = useContainer();

    const dialogContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        ContentEntryFeature.register(child);
        child.register(CmsModelAccessor).inSingletonScope();
        FoldersFeature.register(child, { type: `cms:${modelId}` });
        FolderTreePresenterFeature.register(child);
        ContentEntryFormPresenterFeature.register(child);
        return child;
    }, [modelId]);

    return (
        <DiContainerProvider container={dialogContainer}>
            <GenericModelLoader modelId={modelId}>
                {model => (
                    <NewEntryDrawerContent model={model} onClose={onClose} onChange={onChange} />
                )}
            </GenericModelLoader>
        </DiContainerProvider>
    );
};

interface NewEntryDrawerContentProps {
    model: CmsModel;
    onClose: () => void;
    onChange: (value: CmsReferenceValue) => void;
}

const NewEntryDrawerContent = observer(
    ({ model, onClose, onChange }: NewEntryDrawerContentProps) => {
        const { presenter } = useFeature(ContentEntryFormPresenterFeature);

        useEffect(() => {
            presenter.newEntry();
        }, []);

        const onSave = useCallback(async () => {
            const saved = await presenter.saveRevision({ skipValidation: false });
            if (saved && presenter.vm.entry) {
                onChange({
                    id: presenter.vm.entry.id,
                    modelId: model.modelId
                });
                onClose();
            }
        }, [model.modelId]);

        const vm = presenter.vm;

        return (
            <Drawer
                open={true}
                onClose={onClose}
                width={1000}
                modal={true}
                headerSeparator={true}
                footerSeparator={true}
                bodyPadding={false}
                title={`New ${model.name} Entry`}
                actions={
                    <>
                        <Drawer.CancelButton />
                        <Drawer.ConfirmButton onClick={onSave} text="Create Entry" />
                    </>
                }
            >
                <div className={"p-md relative"}>
                    {vm.loading ? <OverlayLoader text={"Creating entry..."} /> : null}
                    {vm.form ? <FormView name="NewRefEntryForm" form={vm.form} /> : null}
                </div>
            </Drawer>
        );
    }
);
