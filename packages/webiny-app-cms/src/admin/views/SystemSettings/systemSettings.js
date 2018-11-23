//@flow
import React from "react";
import { compose, withState } from "recompose";
import { getPlugins } from "webiny-app/plugins";
import { withSnackbar } from "webiny-app-admin/components";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import { Typography } from "webiny-ui/Typography";
import { Form } from "webiny-form";
import { Icon } from "webiny-ui/Icon";
import { ButtonPrimary } from "webiny-ui/Button";
import { List, ListItem, ListItemGraphic } from "webiny-ui/List";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";
import { get } from "lodash";
import { listItem, ListItemTitle, listStyle, TitleContent } from "./SystemSettingsStyled";
import type { CmsSystemSettingsPluginType } from "webiny-app-cms/types";
import { Query, Mutation } from "react-apollo";
import { getSystemSettings, updateSystemSettings } from "./graphql";

type Props = {
    saveSettings: Function,
    active: string,
    setActive: Function
};

const PageSettings = ({ active, setActive, showSnackbar }: Props) => {
    const plugins: Array<CmsSystemSettingsPluginType> = getPlugins("cms-system-settings");
    const activePlugin: CmsSystemSettingsPluginType = plugins.find(pl => pl.name === active);

    return (
        <AdminLayout>
            <CompactView>
                <LeftPanel span={5}>
                    <List twoLine className={listStyle}>
                        {plugins.map(pl => (
                            <ListItem
                                key={pl.name}
                                className={listItem}
                                onClick={() => setActive(pl.name)}
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
                    <Query query={getSystemSettings()}>
                        {({ data }) => {
                            const settings = get(data, "cms.getSystemSettings.data");
                            if (!settings) {
                                return null;
                            }

                            return (
                                <Mutation mutation={updateSystemSettings()}>
                                    {update => (
                                        <Form
                                            data={settings}
                                            onSubmit={async data => {
                                                await update({ variables: { data } });
                                                showSnackbar("Settings updated successfully.");
                                            }}
                                        >
                                            {({ Bind, submit, data }) => (
                                                <SimpleForm>
                                                    <SimpleFormHeader title={activePlugin.title} />
                                                    <SimpleFormContent>
                                                        {activePlugin
                                                            ? activePlugin.render({ Bind, data })
                                                            : null}
                                                    </SimpleFormContent>
                                                    <SimpleFormFooter>
                                                        <ButtonPrimary
                                                            type="primary"
                                                            onClick={submit}
                                                            align="right"
                                                        >
                                                            Save settings
                                                        </ButtonPrimary>
                                                    </SimpleFormFooter>
                                                </SimpleForm>
                                            )}
                                        </Form>
                                    )}
                                </Mutation>
                            );
                        }}
                    </Query>
                </RightPanel>
            </CompactView>
        </AdminLayout>
    );
};

export default compose(
    withSnackbar(),
    withState("active", "setActive", "cms-system-settings-general")
)(PageSettings);
