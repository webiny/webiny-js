import React, { useRef, useState } from "react";
import { plugins } from "@webiny/plugins";
import { useSnackbar } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n/index.js";
import type { CmsEditorFormSettingsPlugin } from "~/types.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { Drawer, Icon, List } from "@webiny/admin-ui";

const t = i18n.namespace("FormsApp.Editor.FormSettings");

interface FormSettingsProps {
    open: boolean;
    onClose: () => void;
}

const FormSettings = ({ open, onClose }: FormSettingsProps) => {
    const cmsEditorFormSettingsPlugins = plugins.byType<CmsEditorFormSettingsPlugin>(
        "cms-editor-form-settings"
    );
    const { data, setData } = useModelEditor();
    const { showSnackbar } = useSnackbar();
    const [activePlugin, setActivePlugin] = useState(cmsEditorFormSettingsPlugins[0]);
    const submitRef = useRef<((e?: React.SyntheticEvent) => void) | null>(null);

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={t`Content model settings`}
            modal={true}
            showCloseButton={true}
            size={"lg"}
            actions={<Drawer.ConfirmButton text={t`Save`} onClick={() => submitRef.current?.()} />}
        >
            {cmsEditorFormSettingsPlugins.length > 1 && (
                <List>
                    {cmsEditorFormSettingsPlugins.map(pl => (
                        <List.Item
                            key={pl.name}
                            onClick={() => setActivePlugin(pl)}
                            icon={<Icon label={pl.title} icon={pl.icon} />}
                            title={pl.title}
                            description={pl.description}
                        />
                    ))}
                </List>
            )}
            <Form
                data={data}
                onSubmit={formData => {
                    setData(() => formData);
                    onClose();
                    showSnackbar(t`Content model settings updated successfully.`);
                }}
            >
                {({ Bind, submit, form, data: formData }) => {
                    submitRef.current = submit;
                    return (
                        activePlugin ? activePlugin.render({ Bind, form, formData }) : null
                    ) as React.ReactElement;
                }}
            </Form>
        </Drawer>
    );
};

export default FormSettings;
