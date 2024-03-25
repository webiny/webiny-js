import React, { useEffect } from "react";
import { ReactComponent as TouchIcon } from "@material-design-icons/svg/round/touch_app.svg";
import { ResponsiveModeSelector } from "./TopBar/ResponsiveModeSelector";
import { Breadcrumbs } from "./Content/Breadcrumbs";
import { Background } from "./Content/Background";
import { Elements } from "./Content/Elements";
import { ActionPlugins } from "./ActionPlugins";
import { EditorConfig, useEditorConfig } from "~/editor/config";
import { AddElement } from "./Toolbar/AddElement";
import { Navigator } from "./Toolbar/Navigator";
import { Saving } from "./Toolbar/Saving/Saving";
import { Redo, Undo } from "./Toolbar/UndoRedo/UndoRedo";
import { ElementActions } from "./Sidebar/ElementSettings/ElementActions";
import { NoActiveElement } from "./Sidebar/NoActiveElement";
import { InfoMessage } from "./Sidebar/InfoMessage";
import { OnActiveElement } from "./Sidebar/OnActiveElement";
import { ElementSettings } from "./Sidebar/ElementSettings/ElementSettings";
import { StyleSettingsAdapter } from "./Sidebar/BackwardsCompatibility/StyleSettingsAdapter";
import { StyleSettingsGroup } from "./Sidebar/StyleSettings/StyleSettingsGroup";
import { StyleProperties } from "./Sidebar/StyleSettings/StyleProperties";
import { ElementSettingsGroup } from "./Sidebar/ElementSettings/ElementSettingsGroup";
import { ElementActionsAdapter } from "./Sidebar/BackwardsCompatibility/ElementActionsAdapter";

const { TopBar, Content, Toolbar, Sidebar } = EditorConfig;

const LogElements = () => {
    const { elements } = useEditorConfig();
    useEffect(() => {
        console.log(elements);
    }, [elements.length]);
    return null;
};

const ClickToActivate = () => {
    return (
        <NoActiveElement>
            <InfoMessage
                icon={<TouchIcon />}
                message={"Select an element on the canvas to activate this panel."}
            />
        </NoActiveElement>
    );
};

export const DefaultEditorConfig = React.memo(() => {
    return (
        <>
            <ActionPlugins />
            <EditorConfig>
                <TopBar.Element
                    name={"displaySizeSelector"}
                    group={"center"}
                    element={<ResponsiveModeSelector />}
                />
                <Content.Element name={"breadcrumbs"} element={<Breadcrumbs />} />
                <Content.Element name={"background"} element={<Background />} />
                <Content.Element name={"elements"} element={<Elements />} />
                <Toolbar.Element name={"addElement"} group={"top"} element={<AddElement />} />
                <Toolbar.Element name={"navigator"} group={"top"} element={<Navigator />} />
                <Toolbar.Element name={"savingIndicator"} group={"bottom"} element={<Saving />} />
                <Toolbar.Element name={"undo"} group={"bottom"} element={<Undo />} />
                <Toolbar.Element name={"redo"} group={"bottom"} element={<Redo />} />
                {/* Sidebar Groups */}
                <Sidebar.Group name={"style"} element={<StyleSettingsGroup />} />
                <Sidebar.Group name={"element"} element={<ElementSettingsGroup />} />
                {/* Style Settings Tab */}
                <Sidebar.Element
                    name={"styleSettings"}
                    group={"style"}
                    element={
                        <OnActiveElement>
                            <StyleProperties />
                        </OnActiveElement>
                    }
                />
                <Sidebar.Element
                    name={"styleInactive"}
                    group={"style"}
                    element={<ClickToActivate />}
                />
                {/* Element Settings Tab */}
                <Sidebar.Element
                    name={"elementInactive"}
                    group={"element"}
                    element={<ClickToActivate />}
                />
                {/* This element renders element actions. */}
                <Sidebar.Element
                    name={"elementActions"}
                    group={"element"}
                    element={
                        <OnActiveElement>
                            <ElementActions />
                        </OnActiveElement>
                    }
                />
                {/* This element renders element properties. */}
                <Sidebar.Element
                    name={"elementSettings"}
                    group={"element"}
                    element={
                        <OnActiveElement>
                            <ElementSettings />
                        </OnActiveElement>
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
