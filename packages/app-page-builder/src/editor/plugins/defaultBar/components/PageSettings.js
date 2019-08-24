//@flow
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { compose, lifecycle, withHandlers, withState } from "recompose";
import { omit } from "lodash";
import { getPlugins } from "@webiny/plugins";
import { deactivatePlugin, updateRevision } from "@webiny/app-page-builder/editor/actions";
import { getPage } from "@webiny/app-page-builder/editor/selectors";
import { withKeyHandler } from "@webiny/app-page-builder/editor/components";
import { withSnackbar } from "@webiny/app-admin/components";
import { OverlayLayout } from "@webiny/app-admin/components/OverlayLayout";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { Typography } from "@webiny/ui/Typography";
import { Form } from "@webiny/form";
import { Icon } from "@webiny/ui/Icon";
import { ButtonPrimary } from "@webiny/ui/Button";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./PageSettingsStyled";
import type { PbPageSettingsPluginType } from "@webiny/app-page-builder/types";

type Props = {
    deactivatePlugin: Function,
    page: Object,
    savePage: Function,
    active: string,
    setActive: Function
};

const PageSettings = ({ deactivatePlugin, page, savePage, active, setActive }: Props) => {
    const plugins = getPlugins("pb-editor-page-settings");
    const activePlugin: ?PbPageSettingsPluginType = plugins.find(pl => pl.name === active);

    if (!activePlugin) {
        return null;
    }

    return (
        <OverlayLayout
            barMiddle={Title}
            onExited={() => deactivatePlugin({ name: "pb-editor-page-settings-bar" })}
        >
            <SplitView>
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
                                        Save settings
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

export default compose(
    connect(
        state => ({ page: omit(getPage(state), ["content"]) }),
        { deactivatePlugin, updateRevision }
    ),
    withSnackbar(),
    withKeyHandler(),
    withState("active", "setActive", "pb-editor-page-settings-general"),
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
                this.props.deactivatePlugin({ name: "pb-editor-page-settings-bar" });
            });
        },
        componentWillUnmount() {
            this.props.removeKeyHandler("escape");
        }
    })
)(PageSettings);
