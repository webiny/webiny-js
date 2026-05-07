import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useDialog, FormView, FormErrors } from "@webiny/app-admin";
import { Dialog, OverlayLoader, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { AiPowerUpsSettingsFeature } from "./feature.js";

export const AI_POWER_UPS_SETTINGS_DIALOG = "ai-power-ups-settings";

export const AiPowerUpsSettingsDialog = observer(() => {
    const { closeDialog } = useDialog();
    const toast = useToast();
    const { presenter } = useFeature(AiPowerUpsSettingsFeature);
    const vm = presenter.vm;

    useEffect(() => {
        presenter.init();
    }, []);

    const handleSave = async () => {
        const success = await presenter.save();
        if (success) {
            toast.showSuccessToast({
                title: "AI power-ups settings saved successfully!"
            });
            closeDialog();
        }
    };

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="AI Power-Ups"
            size={"xl"}
            className={"w-[1000px] min-h-1/2"}
            actions={
                <>
                    <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                    <Dialog.ConfirmAction onClick={handleSave} text="Save Settings" />
                </>
            }
        >
            {vm.loading || vm.saving ? (
                <OverlayLoader text={vm.saving ? "Saving..." : "Loading..."} />
            ) : null}
            {vm.error ? (
                <div className="text-destructive-default text-sm mb-4">{vm.error}</div>
            ) : null}
            {vm.form ? <div className={"mb-md"}>
                <FormErrors form={vm.form} />
            </div> : null}
            <div className="flex flex-col gap-4">
                {vm.form ? <FormView form={vm.form} /> : null}
            </div>
        </Dialog>
    );
});
