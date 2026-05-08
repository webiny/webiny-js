import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
    FormView,
    FormErrors,
    PresenterErrors,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin";
import { Button, OverlayLoader, useToast } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { AiPowerUpsSettingsFeature } from "./feature.js";

export const AiPowerUpsSettingsPage = observer(() => {
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
        }
    };

    return (
        <div>
            <SimpleForm size={"xl"}>
                {vm.errors.length > 0 ? (
                    <div className={"mb-lg"}>
                        <PresenterErrors errors={vm.errors} />
                    </div>
                ) : null}
                {vm.form && vm.form.errors.length > 0 ? (
                    <div className={"mb-lg"}>
                        <FormErrors form={vm.form} />
                    </div>
                ) : null}
                {vm.loading || vm.saving ? (
                    <OverlayLoader text={vm.saving ? "Saving..." : "Loading..."} />
                ) : null}
                <SimpleFormHeader title="AI Power-Ups" />
                <SimpleFormContent className={"p-0"}>
                    <div className="flex flex-col gap-4">
                        {vm.form ? <FormView name="AI Power-Ups" form={vm.form} /> : null}
                    </div>
                </SimpleFormContent>
                <SimpleFormFooter className={"border-t-sm border-t-neutral-dimmed pt-lg"}>
                    <Button text="Save Settings" onClick={handleSave} />
                </SimpleFormFooter>
            </SimpleForm>
        </div>
    );
});
