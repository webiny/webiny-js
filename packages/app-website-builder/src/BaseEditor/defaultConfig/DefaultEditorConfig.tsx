import React from "react";
import { ReactComponent as TouchIcon } from "@webiny/icons/touch_app.svg";
import { EditorConfig } from "~/BaseEditor/config/index.js";
import { InfoMessage } from "./Sidebar/InfoMessage.js";
import { StyleSettingsGroup } from "./Sidebar/StyleSettings/StyleSettingsGroup.js";
import { StyleProperties } from "./Sidebar/StyleSettings/StyleProperties.js";
import { ElementSettingsGroup } from "./Sidebar/ElementSettings/ElementSettingsGroup.js";
import { InsertElementsTab } from "./Toolbar/InsertElements/InsertElementsTab.js";
import { NavigatorTab } from "./Toolbar/Navigator/NavigatorTab.js";
import { CommandHandlers } from "~/BaseEditor/commandHandlers/index.js";
import { ElementSettings } from "./Sidebar/ElementSettings/ElementSettings.js";
import { ElementInputRenderers } from "./ElementInputRenderers.js";
import { ContentPreviewConfig } from "./Content/ContentPreviewConfig.js";

const { Ui } = EditorConfig;

const ClickToActivate = () => {
    return (
        <Ui.NoActiveElement>
            <InfoMessage
                icon={<TouchIcon />}
                message={"Select an element on the canvas to activate this panel."}
            />
        </Ui.NoActiveElement>
    );
};

export const DefaultEditorConfig = React.memo(() => {
    return (
        <>
            <CommandHandlers />
            <EditorConfig>
                <ElementInputRenderers />
                <ContentPreviewConfig />
                <Ui.Toolbar.Element
                    name={"insertElements"}
                    group={"tabs"}
                    element={<InsertElementsTab />}
                />
                <Ui.Toolbar.Element name={"navigator"} group={"tabs"} element={<NavigatorTab />} />
                {/* Sidebar Groups */}
                <Ui.Sidebar.Group name={"element"} element={<ElementSettingsGroup />} />
                <Ui.Sidebar.Group name={"style"} element={<StyleSettingsGroup />} />
                {/* Style Settings Tab */}
                <Ui.Sidebar.Element
                    name={"styleSettings"}
                    group={"style"}
                    element={
                        <Ui.OnActiveElement>
                            <StyleProperties />
                        </Ui.OnActiveElement>
                    }
                />
                <Ui.Sidebar.Element
                    name={"styleInactive"}
                    group={"style"}
                    element={<ClickToActivate />}
                />
                {/* Element Settings Tab */}
                <Ui.Sidebar.Element
                    name={"elementInactive"}
                    group={"element"}
                    element={<ClickToActivate />}
                />
                {/* This element renders element properties. */}
                <Ui.Sidebar.Element
                    name={"elementSettings"}
                    group={"element"}
                    element={
                        <Ui.OnActiveElement>
                            <ElementSettings />
                        </Ui.OnActiveElement>
                    }
                />
                {/*<Ui.Sidebar.Element
                    name={"stateEditor"}
                    group={"element"}
                    element={<DocumentStateEditor />}
                />*/}
            </EditorConfig>
        </>
    );
});

DefaultEditorConfig.displayName = "DefaultEditorConfig";
