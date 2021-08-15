import React, { useState } from "react";
import { plugins } from "@webiny/plugins";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { Typography } from "@webiny/ui/Typography";
import { Form } from "@webiny/form";
import { Icon } from "@webiny/ui/Icon";
import { ButtonPrimary } from "@webiny/ui/Button";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { useFormEditor } from "../../../../components/FormEditor/Context";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormsApp.Editor.FormSettings");

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./FormSettingsStyled";
import { FbEditorFormSettingsPlugin } from "../../../../../types";

type FormSettingsProps = {
    onExited: () => void;
};

const FormSettings = ({ onExited }: FormSettingsProps) => {
    const formEditorSettingsPlugins = plugins.byType<FbEditorFormSettingsPlugin>(
        "form-editor-form-settings"
    );
    const { data, setData } = useFormEditor();
    const { showSnackbar } = useSnackbar();

    const [activePlugin, setActivePlugin] = useState(formEditorSettingsPlugins[0]);

    return (
        <OverlayLayout
            barMiddle={Title}
            onExited={onExited}
            style={{ color: "var(--mdc-theme-on-surface)" }}
        >
            <SplitView>
                <LeftPanel span={5}>
                    <List twoLine className={listStyle}>
                        {formEditorSettingsPlugins.map(pl => (
                            <ListItem
                                key={pl.name}
                                className={listItem}
                                onClick={() => setActivePlugin(pl)}
                            >
                                <ListItemGraphic>
                                    <Icon icon={pl.icon} />
                                </ListItemGraphic>
                                <TitleContent>
                                    <ListItemTitle>{pl.title}</ListItemTitle>
                                    <Typography use={"subtitle2"}>{pl.description}</Typography>
                                </TitleContent>
                            </ListItem>
                        ))}
                    </List>
                </LeftPanel>
                <RightPanel span={7}>
                    <Form
                        data={data.settings}
                        onSubmit={settings => {
                            setData(data => {
                                data.settings = settings;
                                return data;
                            });
                            onExited();
                            showSnackbar(t`Form settings updated successfully.`);
                        }}
                    >
                        {({ Bind, submit, form, data: formData }) => (
                            <SimpleForm>
                                <SimpleFormHeader title={activePlugin.title}>
                                    {typeof activePlugin.renderHeaderActions === "function" &&
                                        activePlugin.renderHeaderActions({ Bind, form, formData })}
                                </SimpleFormHeader>
                                <SimpleFormContent>
                                    {activePlugin
                                        ? activePlugin.render({ Bind, form, formData })
                                        : null}
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary
                                        onClick={submit}
                                    >{t`Save settings`}</ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        )}
                    </Form>
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default FormSettings;
