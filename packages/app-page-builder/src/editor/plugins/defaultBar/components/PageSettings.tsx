import React, { useState, useCallback, useEffect } from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import {
    DeactivatePluginActionEvent,
    UpdatePageRevisionActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { pageAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
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
import { useRecoilValue } from "recoil";
import { Title, listItem, ListItemTitle, listStyle, TitleContent } from "./PageSettingsStyled";
import { PbEditorPageSettingsPlugin } from "@webiny/app-page-builder/types";
import { useApolloClient } from "react-apollo";

type PageSettingsPropsType = {
    [key: string]: any;
};
const PageSettings: React.FunctionComponent<PageSettingsPropsType> = (props = {}) => {
    const pluginsByType = plugins.byType<PbEditorPageSettingsPlugin>("pb-editor-page-settings");
    const [active, setActive] = useState("pb-editor-page-settings-general");
    const activePlugin = pluginsByType.find(pl => pl.name === active);
    if (!activePlugin) {
        return null;
    }

    return (
        <PageSettingsContent
            {...props}
            setActive={setActive}
            pluginsByType={pluginsByType}
            activePlugin={activePlugin}
        />
    );
};

type PageSettingsContentPropsType = {
    pluginsByType: PbEditorPageSettingsPlugin[];
    setActive: (name: string) => void;
    activePlugin: PbEditorPageSettingsPlugin;
};
const PageSettingsContent: React.FunctionComponent<PageSettingsContentPropsType> = ({
    pluginsByType,
    setActive,
    activePlugin
}) => {
    const eventActionHandler = useEventActionHandler();
    const pageAtomValue = useRecoilValue(pageAtom);
    const apolloClient = useApolloClient();

    const { showSnackbar } = useSnackbar();
    const { removeKeyHandler, addKeyHandler } = useKeyHandler();

    const deactivatePlugin = useCallback(() => {
        eventActionHandler.trigger(
            new DeactivatePluginActionEvent({
                name: "pb-editor-page-settings-bar"
            })
        );
    }, []);

    const page = {
        ...pageAtomValue,
        content: undefined
    };

    const savePage = useCallback(
        pageValue => {
            eventActionHandler.trigger(
                new UpdatePageRevisionActionEvent({
                    page: pageValue,
                    client: apolloClient,
                    onFinish: () => {
                        showSnackbar("Settings saved");
                        deactivatePlugin();
                    }
                })
            );
        },
        [page]
    );

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            deactivatePlugin();
        });

        return () => removeKeyHandler("escape");
    });

    return (
        <OverlayLayout barMiddle={Title} onExited={deactivatePlugin}>
            <SplitView>
                <LeftPanel span={5}>
                    <List twoLine className={listStyle}>
                        {pluginsByType.map(pl => (
                            <ListItem
                                key={pl.name}
                                className={listItem}
                                onClick={() => setActive(pl.name)}
                            >
                                <ListItemGraphic>
                                    <Icon icon={pl.icon as any} />
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
                                    {activePlugin.render({ Bind, form, data } as any)}
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary onClick={submit}>Save settings</ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        )}
                    </Form>
                </RightPanel>
            </SplitView>
        </OverlayLayout>
    );
};

export default React.memo(PageSettings);
