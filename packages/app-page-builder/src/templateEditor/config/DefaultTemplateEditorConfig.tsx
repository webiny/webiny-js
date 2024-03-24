import React from "react";
import { EventActionHandlerPlugin, EventActionPlugins } from "./eventActions";
import { TemplateEditorConfig } from "../editorConfig/TemplateEditorConfig";
import { BackButton } from "./TopBar/BackButton/BackButton";
import { SaveTemplateButton } from "./TopBar/SaveTemplateButton/SaveTemplateButton";
import { TemplateSettingsButton } from "./TopBar/TemplateSettingsButton/TemplateSettingsButton";
import { Title } from "./TopBar/Title/Title";
import { BlocksBrowser } from "./Content/BlocksBrowser/BlocksBrowser";
import { AddBlock } from "./Content/BlocksBrowser/AddBlock";
import { AddContent } from "./Content/BlocksBrowser/AddContent";
import { UnlinkBlock } from "./Sidebar/UnlinkBlock";
import { ElementSettingsGroup } from "./Sidebar/ElementSettingsGroup";
import { RefreshBlockAction } from "./Sidebar/RefreshBlockAction";
import { EditBlockAction } from "./Sidebar/EditBlockAction";
import { HideSaveAction } from "./Sidebar/HideSaveAction";

const { TopBar, Toolbar, Content, Sidebar, Element } = TemplateEditorConfig;

export const DefaultTemplateEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EventActionPlugins />
            <TemplateEditorConfig>
                <TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
                <TopBar.Element name={"title"} group={"left"} element={<Title />} />
                <TopBar.Action
                    name={"buttonTemplateSettings"}
                    element={<TemplateSettingsButton />}
                />
                <TopBar.Action name={"buttonSaveTemplate"} element={<SaveTemplateButton />} />
                <Toolbar.Element name={"savingIndicator"} remove />
                <Content.Element name={"addBlock"} element={<AddBlock />} />
                <Content.Element name={"addContent"} element={<AddContent />} />
                <Element
                    group={"overlays"}
                    name={"blocksBrowser"}
                    element={<BlocksBrowser />}
                />
                <Sidebar.ElementAction name={"editBlock"} element={<EditBlockAction />} />
                <Sidebar.ElementAction name={"refreshBlock"} element={<RefreshBlockAction />} />
                <Sidebar.Element
                    name={"blockActions"}
                    group={"element"}
                    element={<ElementSettingsGroup />}
                />
                <HideSaveAction />
                <UnlinkBlock />
            </TemplateEditorConfig>
        </>
    );
});

DefaultTemplateEditorConfig.displayName = "DefaultTemplateEditorConfig";
