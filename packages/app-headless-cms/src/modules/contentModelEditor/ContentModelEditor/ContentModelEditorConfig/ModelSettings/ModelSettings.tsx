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
import { CmsEditorModelSettingsPlugin } from "~/types";
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./ModelSettingsStyled";
import { useContentModelEditor } from "~/modelEditor";

const t = i18n.namespace("FormsApp.Editor.ModelSettings");

interface ModelSettingsProps {
    onExited: () => void;
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({ onExited }) => {
    const cmsEditorModelSettingsPlugins = plugins.byType<CmsEditorModelSettingsPlugin>(
        "cms-editor-model-settings"
    );
    const { data, setData } = useContentModelEditor();
    const { showSnackbar } = useSnackbar();

    const [activePlugin, setActivePlugin] = useState(cmsEditorModelSettingsPlugins[0]);

    return (
        <OverlayLayout barMiddle={Title} onExited={onExited}>
            <SplitView>
                <LeftPanel span={5}>
                    <List twoLine className={listStyle}>
                        {cmsEditorModelSettingsPlugins.map(pl => (
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
                    {activePlugin ? (
                        <Form
                            data={data}
                            onSubmit={data => {
                                setData(() => data);
                                onExited();
                                showSnackbar(t`Content model settings updated successfully.`);
                            }}
                        >
                            {({ submit }) => (
                                <SF.SimpleForm>
                                    <SF.SimpleFormHeader title={activePlugin.title}>
                                        {activePlugin.renderHeaderActions
                                            ? activePlugin.renderHeaderActions()
                                            : null}
                                    </SF.SimpleFormHeader>
                                    <SF.SimpleFormContent>
                                        {activePlugin.render()}
                                    </SF.SimpleFormContent>
                                    <SF.SimpleFormFooter>
                                        <ButtonPrimary
                                            onClick={ev => {
                                                submit(ev);
                                            }}
                                        >{t`Save settings`}</ButtonPrimary>
                                    </SF.SimpleFormFooter>
                                </SF.SimpleForm>
                            )}
                        </Form>
                    ) : null}
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};
