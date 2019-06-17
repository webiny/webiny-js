//@flow
// $FlowFixMe
import React, { useState } from "react";
import { compose } from "recompose";
import { getPlugins } from "webiny-plugins";
import { OverlayLayout } from "webiny-admin/components/OverlayLayout";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { Typography } from "webiny-ui/Typography";
import { Form } from "webiny-form";
import { Icon } from "webiny-ui/Icon";
import { ButtonPrimary } from "webiny-ui/Button";
import { List, ListItem, ListItemGraphic } from "webiny-ui/List";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { withSnackbar, type WithSnackbarProps } from "webiny-admin/components";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.Editor.FormSettings");

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/SimpleForm";
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./FormSettingsStyled";
import type { CmsPageSettingsPluginType } from "webiny-app-cms/types";

type Props = {
    onExited: Function
} & WithSnackbarProps;

const FormSettings = ({ onExited, showSnackbar }: Props) => {
    const plugins: Array<CmsPageSettingsPluginType> = getPlugins("form-editor-form-settings");
    const { data, setData } = useFormEditor();

    const [activePlugin, setActivePlugin] = useState(plugins[0]);

    return (
        <OverlayLayout barMiddle={Title} onExited={onExited}>
            <SplitView>
                <LeftPanel span={5}>
                    <List twoLine className={listStyle}>
                        {plugins.map(pl => (
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
                                console.log('setam sets', settings)
                                data.settings = settings;
                                return data;
                            });
                            onExited();
                            showSnackbar(t`Form settings updated successfully.`);
                        }}
                    >
                        {({ Bind, submit, form, data }) => (
                            <SimpleForm>
                                <SimpleFormHeader title={activePlugin.title} />
                                <SimpleFormContent>
                                    {activePlugin
                                        ? activePlugin.render({ Bind, form, data })
                                        : null}
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary type="primary" onClick={submit} align="right">
                                        {t`Save settings`}
                                    </ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        )}
                    </Form>
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default compose(withSnackbar())(FormSettings);
