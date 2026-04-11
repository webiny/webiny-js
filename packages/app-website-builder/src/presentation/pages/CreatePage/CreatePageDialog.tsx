import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useDialog, useOpenDialog, FormView, defaultFieldRenderers } from "@webiny/app-admin";
import { Dialog, Select } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { useCreatePage } from "~/features/pages/index.js";
import { useEditPageUrl } from "~/modules/pages/PagesList/hooks/useEditPageUrl.js";
import { CreatePageFeature } from "./feature.js";
import { createPageDialogParams } from "./createPageSchema.js";
import { OverlayLoader } from "@webiny/admin-ui";

export const CREATE_PAGE_DIALOG = "createPage";

export const useCreatePageDialog = () => {
    const { openDialog } = useOpenDialog(createPageDialogParams);

    return (folderId: string) => {
        openDialog(CREATE_PAGE_DIALOG, { folderId });
    };
};

export const CreatePageDialog = observer(() => {
    const [loading, setLoading] = useState(false);
    const { params, closeDialog } = useDialog(createPageDialogParams);
    const { createPage } = useCreatePage();
    const { goToPageEditor } = useEditPageUrl();
    const { presenter } = useFeature(CreatePageFeature);
    const vm = presenter.vm;

    useEffect(() => {
        const defaultPageType = vm.pageTypes[0]?.name ?? "static";
        presenter.init(defaultPageType, params.folderId);
    }, []);

    const handlePageTypeChange = (pageType: string) => {
        presenter.init(pageType, params.folderId);
    };

    const handleSubmit = async () => {
        const input = await presenter.submit();
        if (!input) {
            return;
        }

        setLoading(true);
        const page = await createPage(input);
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
            {loading ? <OverlayLoader text={"Creating page..."} /> : null}
            <div className="flex flex-col gap-4">
                {vm.pageTypes.length > 1 && (
                    <Select
                        label="Page Type"
                        value={vm.selectedPageType}
                        onChange={handlePageTypeChange}
                        options={vm.pageTypes.map(pt => ({
                            label: pt.label,
                            value: pt.name
                        }))}
                        displayResetAction={false}
                    />
                )}
                <FormView form={vm.form} renderers={defaultFieldRenderers} />
            </div>
        </Dialog>
    );
});
