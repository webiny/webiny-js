import React, { useState } from "react";
import { plugins } from "@webiny/plugins";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { Typography } from "@webiny/ui/Typography";
import { Form } from "@webiny/form";
import { Icon } from "@webiny/ui/Icon";
import { ButtonPrimary } from "@webiny/ui/Button";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import * as SF from "@webiny/app-admin/components/SimpleForm";
import { CmsEditorFormSettingsPlugin } from "~/types";
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./FormSettingsStyled";
import { useContentModelEditor } from "~/admin/components/ContentModelEditor/useContentModelEditor";

const t = i18n.namespace("FormsApp.Editor.FormSettings");

type FormSettingsProps = {
    onExited: () => void;
};

const FormSettings = ({ onExited }: FormSettingsProps) => {
    const cmsEditorFormSettingsPlugins = plugins.byType<CmsEditorFormSettingsPlugin>(
        "cms-editor-form-settings"
    );
    const { data, setData } = useContentModelEditor();
    const { showSnackbar } = useSnackbar();

    const [activePlugin, setActivePlugin] = useState(cmsEditorFormSettingsPlugins[0]);

    return (
        <OverlayLayout barMiddle={Title} onExited={onExited}>
            <SplitView>
                <LeftPanel span={5}>
                    <List twoLine className={listStyle}>
                        {cmsEditorFormSettingsPlugins.map(pl => (
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
                        data={data}
                        onSubmit={data => {
                            setData(() => data);
                            onExited();
                            showSnackbar(t`Content model settings updated successfully.`);
                        }}
                    >
                        {({ Bind, submit, form, data: formData }) => (
                            <SF.SimpleForm>
                                <SF.SimpleFormHeader title={activePlugin.title}>
                                    {typeof activePlugin.renderHeaderActions === "function" &&
                                        activePlugin.renderHeaderActions({ Bind, form, formData })}
                                </SF.SimpleFormHeader>
                                <SF.SimpleFormContent>
                                    {activePlugin
                                        ? activePlugin.render({ Bind, form, formData })
                                        : null}
                                </SF.SimpleFormContent>
                                <SF.SimpleFormFooter>
                                    <ButtonPrimary
                                        onClick={submit}
                                    >{t`Save settings`}</ButtonPrimary>
                                </SF.SimpleFormFooter>
                            </SF.SimpleForm>
                        )}
                    </Form>
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default FormSettings;
