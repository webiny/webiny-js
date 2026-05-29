import React from "react";
import { observer } from "mobx-react-lite";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useRedirectListPresenter } from "~/presentation/redirects/RedirectList/RedirectListPresenterProvider.js";

export const CreateRedirectDialog = observer(function CreateRedirectDialog() {
    const { vm, actions } = useRedirectListPresenter();
    const presenter = vm.createRedirect;

    if (!presenter) {
        return null;
    }

    return (
        <Dialog
            open={true}
            onClose={() => actions.hideCreateDialog()}
            title="Create a Redirect"
            actions={
                <>
                    <Dialog.CancelAction onClick={() => actions.hideCreateDialog()} text="Cancel" />
                    <Dialog.ConfirmAction
                        onClick={async () => {
                            const saved = await presenter.save();
                            if (saved) {
                                actions.hideCreateDialog();
                                void actions.refresh();
                            }
                        }}
                        text="Create"
                        disabled={!!presenter.vm.loading}
                    />
                </>
            }
        >
            {presenter.vm.loading ? <OverlayLoader text={presenter.vm.loading} /> : null}
            <FormView name="CreateRedirect" form={presenter.vm.form} />
        </Dialog>
    );
});
