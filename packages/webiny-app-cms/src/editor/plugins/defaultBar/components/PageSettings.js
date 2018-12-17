//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, lifecycle, withHandlers, withState } from "recompose";
import { omit } from "lodash";
import { getPlugins } from "webiny-plugins";
import { deactivatePlugin, updateRevision } from "webiny-app-cms/editor/actions";
import { getPage } from "webiny-app-cms/editor/selectors";
import { withKeyHandler } from "webiny-app-cms/editor/components";
import { withSnackbar } from "webiny-app-admin/components";
import { SecondaryLayout } from "webiny-app-admin/components/Views/SecondaryLayout";
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
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./PageSettingsStyled";
import type { CmsPageSettingsPluginType } from "webiny-app-cms/types";

type Props = {
    deactivatePlugin: Function,
    page: Object,
    savePage: Function,
    active: string,
    setActive: Function
};

const PageSettings = ({ deactivatePlugin, page, savePage, active, setActive }: Props) => {
    const plugins = getPlugins("cms-editor-page-settings");
    const activePlugin: ?CmsPageSettingsPluginType = plugins.find(pl => pl.name === active);

    if (!activePlugin) {
        return null;
    }

    return (
        <SecondaryLayout
            barMiddle={Title}
            onExited={() => deactivatePlugin({ name: "cms-page-settings-bar" })}
        >
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
                    <Form data={page} onSubmit={savePage}>
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
        </SecondaryLayout>
    );
};

export default compose(
    connect(
        state => ({ page: omit(getPage(state), ["content"]) }),
        { deactivatePlugin, updateRevision }
    ),
    withSnackbar(),
    withKeyHandler(),
    withState("active", "setActive", "cms-editor-page-settings-general"),
    withHandlers({
        savePage: ({ showSnackbar, updateRevision }) => (page: Object) =>
            updateRevision(page, {
                onFinish: () => showSnackbar("Settings saved")
            })
    }),
    lifecycle({
        componentDidMount() {
            this.props.addKeyHandler("escape", e => {
                e.preventDefault();
                this.props.deactivatePlugin({ name: "cms-page-settings-bar" });
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("escape");
        }
    })
)(PageSettings);
