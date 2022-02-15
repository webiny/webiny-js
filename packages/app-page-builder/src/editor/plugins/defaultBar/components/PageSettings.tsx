/**
 * TODO: @ts-refactor
 * Verify that this file is used somewhere.
 */
import React, { useState } from "react";
import { plugins } from "@webiny/plugins";
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
import { PbEditorPageSettingsPlugin } from "~/types";
import { usePageSettings } from "~/editor/hooks/usePageSettings";

interface PageSettingsPropsType {
    [key: string]: any;
}
const PageSettings: React.FunctionComponent<PageSettingsPropsType> = (props = {}) => {
    const pluginsByType = plugins.byType<PbEditorPageSettingsPlugin>("pb-editor-page-settings");
    const [active, setActive] = useState(pluginsByType[0].name);
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

interface PageSettingsContentPropsType {
    pluginsByType: PbEditorPageSettingsPlugin[];
    setActive: (name: string) => void;
    activePlugin: PbEditorPageSettingsPlugin;
}
const PageSettingsContent: React.FunctionComponent<PageSettingsContentPropsType> = ({
    pluginsByType,
    setActive,
    activePlugin
}) => {
    const { pageData, closeSettings, savePage } = usePageSettings();
    return (
        <OverlayLayout barMiddle={Title} onExited={closeSettings}>
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
                    <Form data={pageData} onSubmit={savePage}>
                        {({ Bind, submit, form, data, setValue }) => (
                            <SimpleForm>
                                <SimpleFormHeader title={activePlugin.title} />
                                <SimpleFormContent>
                                    {activePlugin.render({ Bind, form, data, setValue } as any)}
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
