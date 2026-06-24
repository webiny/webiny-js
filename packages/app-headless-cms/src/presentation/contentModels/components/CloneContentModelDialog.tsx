import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { Button, OverlayLoader } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsModel } from "~/types.js";
import { Dialog } from "~/admin/components/Dialog.js";
import { Routes } from "~/routes.js";
import { useCloneContentModelPresenter } from "~/presentation/cloneContentModel/useCloneContentModelPresenter.js";

const t = i18n.ns("app-headless-cms/admin/views/content-models/clone-content-model-dialog");

interface CloneContentModelDialogProps {
    onClose: () => void;
    contentModel: CmsModel;
    closeModal: () => void;
}

export const CloneContentModelDialog = observer(
    ({ onClose, contentModel, closeModal }: CloneContentModelDialogProps) => {
        const presenter = useCloneContentModelPresenter();
        const { goToRoute } = useRouter();

        useEffect(() => {
            presenter.init(contentModel);
            return () => {
                presenter.reset();
            };
        }, [contentModel.modelId]);

        const handleSave = useCallback(async () => {
            const model = await presenter.save();
            if (model) {
                closeModal();
                goToRoute(Routes.ContentModels.List);
            }
        }, [presenter, closeModal]);

        const { vm } = presenter;

        return (
            <Dialog
                open={true}
                onClose={onClose}
                data-testid="cms-clone-content-model-modal"
                title={t`Clone Content Model`}
            >
                {vm.loading && (
                    <OverlayLoader text={"Please wait while we load required information."} />
                )}
                {vm.saving && <OverlayLoader />}
                <FormView name={"CloneContentModel"} form={vm.form} />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "16px"
                    }}
                >
                    <Button variant={"secondary"} onClick={handleSave}>
                        + {t`Clone`}
                    </Button>
                </div>
            </Dialog>
        );
    }
);
