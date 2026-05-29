import React from "react";
import { observer } from "mobx-react-lite";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";

export const EditRedirectDialog = observer(function EditRedirectDialog() {
    const { vm, actions } = useRedirectListPresenter();
    const presenter = vm.editRedirect;

    if (!presenter) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onClose={() => actions.hideEditDialog()}
            title="Edit Redirect"
            actions={
                <>
                    <Dialog.CancelAction onClick={() => actions.hideEditDialog()} text="Cancel" />
                    <Dialog.ConfirmAction
                        onClick={async () => {
                            const saved = await presenter.save();
                            if (saved) {
                                actions.hideEditDialog();
                                void actions.refresh();
                            }
                        }}
                        text="Save"
                        disabled={!!presenter.vm.loading}
                    />
                </>
            }
        >
            {presenter.vm.loading ? <OverlayLoader text={presenter.vm.loading} /> : null}
            <FormView name="EditRedirect" form={presenter.vm.form} />
        </Dialog>
    );
});
