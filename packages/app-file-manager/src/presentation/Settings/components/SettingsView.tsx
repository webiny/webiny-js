import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import {
    CenteredView,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useSnackbar
} from "@webiny/app-admin";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useContainer } from "@webiny/app";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { GetSettingsRepository } from "../../../features/settings/abstractions.js";
import { createSettingsPresenter } from "../SettingsPresenter.js";

// Resolves DI dependencies and creates the presenter.
function useSettingsPresenter() {
    const container = useContainer();

    return useMemo(() => {
        const settingsRepository = container.resolve(GetSettingsRepository);
        const formModelFactory = container.resolve(FormModelFactory);
        return createSettingsPresenter(settingsRepository, formModelFactory);
    }, [container]);
}

export const SettingsView = observer(function SettingsView() {
    const presenter = useSettingsPresenter();
    const { showSnackbar } = useSnackbar();
    const { vm } = presenter;

    useEffect(() => {
        presenter.load();
    }, [presenter]);

    const handleSave = async () => {
        const success = await presenter.save();
        if (success) {
            showSnackbar("Settings updated successfully.");
        }
    };

    return (
        <CenteredView>
            <SimpleForm>
                {(vm.loading || vm.saving) && <OverlayLoader />}
                <SimpleFormHeader title="General Settings" />
                <SimpleFormContent>
                    <FormView form={vm.form} />
                </SimpleFormContent>
                <SimpleFormFooter>
                    <Button text={"Save settings"} onClick={handleSave} />
                </SimpleFormFooter>
            </SimpleForm>
        </CenteredView>
    );
});
