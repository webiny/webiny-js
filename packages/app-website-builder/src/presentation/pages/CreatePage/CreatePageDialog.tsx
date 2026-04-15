import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useDialog, useOpenDialog, FormView } from "@webiny/app-admin";
import { Dialog, Select, OverlayLoader } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";
import { CreatePageFeature } from "./feature.js";
import { createPageDialogParams } from "./createPageSchema.js";

export const CREATE_PAGE_DIALOG = "createPage";

export const useCreatePageDialog = () => {
    const { openDialog } = useOpenDialog(createPageDialogParams);

    return (folderId: string) => {
        openDialog(CREATE_PAGE_DIALOG, { folderId });
    };
};

export const CreatePageDialog = observer(() => {
    const { params, closeDialog } = useDialog(createPageDialogParams);
    const { goToPageEditor } = useEditPageUrl();
    const { presenter } = useFeature(CreatePageFeature);
    const vm = presenter.vm;

    useEffect(() => {
        presenter.init(params.folderId);
    }, []);

    const handleSubmit = async () => {
        const page = await presenter.submit();
        if (!page) {
            return;
        }

        closeDialog();
        goToPageEditor(page.id);
    };

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="Create a Page"
            actions={
                <>
                    <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                    <Dialog.ConfirmAction onClick={handleSubmit} text="Create" />
                </>
            }
        >
            {vm.loading ? <OverlayLoader text={"Creating page..."} /> : null}
            <div className="flex flex-col gap-4">
                {vm.pageTypes.length > 1 && (
                    <Select
                        label="Page Type"
                        value={vm.selectedPageType}
                        onChange={presenter.changePageType}
                        options={vm.pageTypes.map(pt => ({
                            label: pt.label,
                            value: pt.name
                        }))}
                        displayResetAction={false}
                    />
                )}
                <FormView form={vm.form} />
            </div>
        </Dialog>
    );
});
