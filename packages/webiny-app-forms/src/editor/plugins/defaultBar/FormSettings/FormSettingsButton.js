import React, { useState, useCallback } from "react";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as SettingsIcon } from "./../icons/settings.svg";
import { FormSettingsDialog } from "./FormSettingsDialog";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { withSnackbar } from "webiny-admin/components";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.Editor.Settings");

const FormSettingsButton = ({ showSnackbar }) => {
    const [opened, setOpened] = useState(false);
    const open = useCallback(() => setOpened(true), []);
    const close = useCallback(() => setOpened(false), []);

    const { setData } = useFormEditor();

    return (
        <>
            <IconButton onClick={open} icon={<SettingsIcon />} />
            <FormSettingsDialog
                open={opened}
                onClose={close}
                onSubmit={settings => {
                    setData(data => {
                        data.settings = settings;
                        return data;
                    });
                    close();
                    showSnackbar(t`Form settings updated successfully.`);
                }}
            />
        </>
    );
};

export default withSnackbar()(FormSettingsButton);
