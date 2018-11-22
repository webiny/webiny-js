//@flow
import React from "react";
import { compose, withHandlers, withState } from "recompose";
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
import { listItem, ListItemTitle, listStyle, TitleContent } from "./WebsiteSettingsStyled";
import type { CmsSettingsPluginType } from "webiny-app-cms/types";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
// import getWebsiteSettingsGraphqlFields from "./getWebsiteSettingsGraphqlFields";

type Props = {
    saveSettings: Function,
    active: string,
    setActive: Function
};

const PageSettings = ({ active, setActive, saveSettings }: Props) => {
    const plugins = getPlugins("cms-website-settings");
    const page = {
        title: "baja"
    };
    const activePlugin: CmsSettingsPluginType = plugins.find(pl => pl.name === active);

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
                    <Form data={page} onSubmit={saveSettings}>
                        {({ Bind, submit }) => (
                            <SimpleForm>
                                <SimpleFormHeader title={activePlugin.title} />
                                <SimpleFormContent>
                                    {activePlugin ? activePlugin.render({ Bind }) : null}
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary type="primary" onClick={submit} align="right">
                                        Save settings
                                    </ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        )}
                    </Form>
                </RightPanel>
            </CompactView>
        </AdminLayout>
    );
};

export default compose(
    withSnackbar(),
    withState("active", "setActive", "cms-website-settings-general"),
    graphql(
        gql`
            mutation saveSettings($data: JSON) {
                cms {
                    updateWebsiteSettings(data: $data) {
                        data {
                            id
                        }
                        error {
                            code
                            message
                            data
                        }
                    }
                }
            }
        `,
        { name: "saveSettings" }
    ),
    withHandlers({
        saveSettings: ({ showSnackbar, updateRevision }) => (page: Object) =>
            updateRevision(page, {
                onFinish: () => showSnackbar("Settings saved")
            })
    })
)(PageSettings);
