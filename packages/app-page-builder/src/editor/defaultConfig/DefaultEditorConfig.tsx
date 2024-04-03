import React from "react";
import { ReactComponent as TouchIcon } from "@material-design-icons/svg/round/touch_app.svg";
import { DisplayModeSelector } from "./TopBar/DisplayModeSelector";
import { Breadcrumbs } from "./Content/Breadcrumbs";
import { Background } from "./Content/Background";
import { Elements } from "./Content/Elements";
import { ActionPlugins } from "./ActionPlugins";
import { EditorConfig } from "~/editor/config";
import { AddElement } from "./Toolbar/AddElement";
import { Navigator } from "./Toolbar/Navigator";
import { Saving } from "./Toolbar/Saving/Saving";
import { Redo, Undo } from "./Toolbar/UndoRedo/UndoRedo";
import { ElementActions } from "./Sidebar/ElementSettings/ElementActions";
import { InfoMessage } from "./Sidebar/InfoMessage";
import { ElementSettings } from "./Sidebar/ElementSettings/ElementSettings";
import { StyleSettingsAdapter } from "./Sidebar/BackwardsCompatibility/StyleSettingsAdapter";
import { StyleSettingsGroup } from "./Sidebar/StyleSettings/StyleSettingsGroup";
import { StyleProperties } from "./Sidebar/StyleSettings/StyleProperties";
import { ElementSettingsGroup } from "./Sidebar/ElementSettings/ElementSettingsGroup";
import { ElementActionsAdapter } from "./Sidebar/BackwardsCompatibility/ElementActionsAdapter";
import { PageOptionsDropdown } from "./TopBar/DropdownActions/PageOptionsDropdown";

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
            <ActionPlugins />
            <EditorConfig>
                <Ui.TopBar.Element
                    name={"displayModeSelector"}
                    group={"center"}
                    element={<DisplayModeSelector />}
                />
                <Ui.TopBar.Action name={"dropdownActions"} element={<PageOptionsDropdown />} />
                <Ui.Content.Element name={"breadcrumbs"} element={<Breadcrumbs />} />
                <Ui.Content.Element name={"background"} element={<Background />} />
                <Ui.Content.Element name={"elements"} element={<Elements />} />
                <Ui.Toolbar.Element name={"addElement"} group={"top"} element={<AddElement />} />
                <Ui.Toolbar.Element name={"navigator"} group={"top"} element={<Navigator />} />
                <Ui.Toolbar.Element
                    name={"savingIndicator"}
                    group={"bottom"}
                    element={<Saving />}
                />
                <Ui.Toolbar.Element name={"undo"} group={"bottom"} element={<Undo />} />
                <Ui.Toolbar.Element name={"redo"} group={"bottom"} element={<Redo />} />
                {/* Sidebar Groups */}
                <Ui.Sidebar.Group name={"style"} element={<StyleSettingsGroup />} />
                <Ui.Sidebar.Group name={"element"} element={<ElementSettingsGroup />} />
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
                {/* This element renders element actions. */}
                <Ui.Sidebar.Element
                    name={"elementActions"}
                    group={"element"}
                    element={
                        <Ui.OnActiveElement>
                            <ElementActions />
                        </Ui.OnActiveElement>
                    }
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
                {/* This will register style settings from plugins using the new API. */}
                <StyleSettingsAdapter />
                {/* This will register actions from plugins using the new API. */}
                <ElementActionsAdapter />
            </EditorConfig>
        </>
    );
});

DefaultEditorConfig.displayName = "DefaultEditorConfig";
