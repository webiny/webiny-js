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

const { Ui, ElementAction } = TemplateEditorConfig;

export const DefaultTemplateEditorConfig = React.memo(() => {
    return (
        <>
            <EventActionHandlerPlugin />
            <EventActionPlugins />
            <TemplateEditorConfig>
                <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
                <Ui.TopBar.Element name={"title"} group={"left"} element={<Title />} />
                <Ui.TopBar.Action
                    name={"buttonTemplateSettings"}
                    element={<TemplateSettingsButton />}
                />
                <Ui.TopBar.Action name={"buttonSaveTemplate"} element={<SaveTemplateButton />} />
                <Ui.Toolbar.Element name={"savingIndicator"} remove />
                <Ui.Content.Element name={"addBlock"} element={<AddBlock />} />
                <Ui.Content.Element name={"addContent"} element={<AddContent />} />
                <Ui.Element group={"overlays"} name={"blocksBrowser"} element={<BlocksBrowser />} />
                <Ui.Sidebar.Element
                    name={"blockActions"}
                    group={"element"}
                    element={<ElementSettingsGroup />}
                />
                <ElementAction name={"editBlock"} element={<EditBlockAction />} />
                <ElementAction name={"refreshBlock"} element={<RefreshBlockAction />} />
                <HideSaveAction />
                <UnlinkBlock />
            </TemplateEditorConfig>
        </>
    );
});

DefaultTemplateEditorConfig.displayName = "DefaultTemplateEditorConfig";
