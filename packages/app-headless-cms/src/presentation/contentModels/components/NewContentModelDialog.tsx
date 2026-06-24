import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSnackbar } from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { Button, OverlayLoader } from "@webiny/admin-ui";
import { Dialog as AdminUiDialog } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { type DialogProps } from "~/admin/components/Dialog.js";
import { Routes } from "~/routes.js";
import { useNewContentModelPresenter } from "~/presentation/newContentModel/useNewContentModelPresenter.js";

const t = i18n.ns("app-headless-cms/admin/views/content-models/new-content-model-dialog");

export interface NewContentModelDialogProps {
    open: boolean;
    onClose: DialogProps["onClose"];
}

const NewContentModelDialog = observer(({ open, onClose }: NewContentModelDialogProps) => {
    const presenter = useNewContentModelPresenter();
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        if (open) {
            presenter.init();
        } else {
            presenter.reset();
        }
    }, [open]);

    const handleSave = useCallback(async () => {
        const model = await presenter.save();
        if (model) {
            goToRoute(Routes.ContentModels.Editor, { modelId: model.modelId });
        }
    }, [presenter]);

    const { vm } = presenter;

    return (
        <AdminUiDialog
            open={open}
            onClose={onClose}
            data-testid="cms-new-content-model-modal"
            title={t`New Content Model`}
            loading={vm.saving ? { text: "Creating content model..." } : false}
            actions={
                <AdminUiDialog.ConfirmAction onClick={handleSave}>
                    + {t`Create Model`}
                </AdminUiDialog.ConfirmAction>
            }
        >
            <>
                {vm.loading && (
                    <OverlayLoader text={"Please wait while we load required information."} />
                )}
                <FormView name={"NewContentModel"} form={vm.form} />
            </>
        </AdminUiDialog>
    );
});

export default NewContentModelDialog;
