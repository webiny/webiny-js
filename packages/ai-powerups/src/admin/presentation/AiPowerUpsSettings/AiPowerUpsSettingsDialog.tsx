import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useDialog, FormView } from "@webiny/app-admin";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { AiPowerUpsSettingsFeature } from "./feature.js";

export const AI_PowerUpS_SETTINGS_DIALOG = "ai-PowerUps-settings";

export const AiPowerUpsSettingsDialog = observer(() => {
    const { closeDialog } = useDialog();
    const { presenter } = useFeature(AiPowerUpsSettingsFeature);
    const vm = presenter.vm;

    useEffect(() => {
        presenter.init();
    }, []);

    const handleSave = async () => {
        const success = await presenter.save();
        if (success) {
            closeDialog();
        }
    };

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="AI Power Ups"
            size={"xl"}
            className={"w-[1000px]"}
            actions={
                <>
                    <Dialog.CancelAction onClick={closeDialog} text="Cancel" />
                    <Dialog.ConfirmAction onClick={handleSave} text="Save" />
                </>
            }
        >
            {vm.loading || vm.saving ? (
                <OverlayLoader text={vm.saving ? "Saving..." : "Loading..."} />
            ) : null}
            {vm.error ? (
                <div className="text-destructive-default text-sm mb-4">{vm.error}</div>
            ) : null}
            {vm.form && vm.form.errors.length > 0 ? (
                <div className="flex flex-col gap-1 mb-4">
                    {vm.form.errors.map((err, i) => (
                        <div key={i} className="text-destructive-default text-sm">
                            {err.label ? `${err.label}: ${err.message}` : err.message}
                        </div>
                    ))}
                </div>
            ) : null}
            <div className="flex flex-col gap-4">
                {vm.form ? <FormView form={vm.form} /> : null}
            </div>
        </Dialog>
    );
});
