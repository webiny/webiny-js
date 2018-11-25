//@flow
import React from "react";
import { compose, withState } from "recompose";
import { getPlugins } from "webiny-app/plugins";
import { withSnackbar } from "webiny-app-admin/components";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import { Typography } from "webiny-ui/Typography";
import { Icon } from "webiny-ui/Icon";
import { ButtonPrimary } from "webiny-ui/Button";
import { List, ListItem, ListItemGraphic } from "webiny-ui/List";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";
import { listItem, ListItemTitle, listStyle, TitleContent } from "./SettingsStyled";
import type { SettingsPluginType } from "webiny-app-admin/types";

type Props = {
    saveSettings: Function,
    active: string,
    setActive: Function
};

const Settings = ({ active, setActive }: Props) => {
    const plugins: Array<SettingsPluginType> = getPlugins("settings");
    const activePlugin: SettingsPluginType = plugins.find(pl => pl.name === active);

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
                    {activePlugin ? (
                        <SimpleForm>
                            <SimpleFormHeader title={activePlugin.title} />
                            <SimpleFormContent>
                                {activePlugin ? activePlugin.render() : null}
                            </SimpleFormContent>
                            <SimpleFormFooter>
                                <ButtonPrimary type="primary" align="right">
                                    Save settings
                                </ButtonPrimary>
                            </SimpleFormFooter>
                        </SimpleForm>
                    ) : (
                        <span>Please select a category plugin.</span>
                    )}
                </RightPanel>
            </CompactView>
        </AdminLayout>
    );
};

export default compose(
    withSnackbar(),
    withState("active", "setActive", "settings-cms-general")
)(Settings);
