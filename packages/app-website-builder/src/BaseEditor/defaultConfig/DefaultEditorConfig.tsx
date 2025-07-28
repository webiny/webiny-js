import React from "react";
import { ReactComponent as TouchIcon } from "@webiny/icons/touch_app.svg";
import { Breadcrumbs } from "./Content/Breadcrumbs";
import { EditorConfig } from "~/BaseEditor/config";
import { InfoMessage } from "./Sidebar/InfoMessage";
import { StyleSettingsGroup } from "./Sidebar/StyleSettings/StyleSettingsGroup";
import { StyleProperties } from "./Sidebar/StyleSettings/StyleProperties";
import { ElementSettingsGroup } from "./Sidebar/ElementSettings/ElementSettingsGroup";
import { InsertElementsTab } from "./Toolbar/InsertElements/InsertElementsTab";
import { NavigatorTab } from "./Toolbar/Navigator/NavigatorTab";
import { CommandHandlers } from "~/BaseEditor/commandHandlers";
import { ElementSettings } from "./Sidebar/ElementSettings/ElementSettings";
import { ElementInputRenderers } from "./ElementInputRenderers";
import { DocumentPreview } from "./Content/Preview/DocumentPreview";

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
            <EditorConfig>
                <CommandHandlers />
                <ElementInputRenderers />
                <Ui.Content.Element name={"breadcrumbs"} element={<Breadcrumbs />} />
                <Ui.Content.Element name={"preview"} element={<DocumentPreview />} />
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
