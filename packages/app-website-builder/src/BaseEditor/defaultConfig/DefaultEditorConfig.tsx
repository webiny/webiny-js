import React from "react";
import { ReactComponent as TouchIcon } from "@webiny/icons/touch_app.svg";
import { Breadcrumbs } from "./Content/Breadcrumbs";
import { Background } from "./Content/Background";
import { EditorConfig } from "~/BaseEditor/config";
// import { Navigator } from "./Toolbar/Navigator";
// import { Saving } from "./Toolbar/Saving/Saving";
// import { ElementActions } from "./Sidebar/ElementSettings/ElementActions";
import { InfoMessage } from "./Sidebar/InfoMessage";
// import { ElementSettings } from "./Sidebar/ElementSettings/ElementSettings";
import { StyleSettingsGroup } from "./Sidebar/StyleSettings/StyleSettingsGroup";
import { StyleProperties } from "./Sidebar/StyleSettings/StyleProperties";
import { ElementSettingsGroup } from "./Sidebar/ElementSettings/ElementSettingsGroup";
import { PageOptionsDropdown } from "./TopBar/DropdownActions/PageOptionsDropdown";
import { Preview } from "./Content/Preview";
import { InsertElements } from "./Toolbar/InsertElements";
import { CommandHandlers } from "~/BaseEditor/commandHandlers";
import { ElementSettings } from "./Sidebar/ElementSettings/ElementSettings";
import { ElementInputRenderers } from "./ElementInputRenderers";
import { BackButton } from "./TopBar/BackButton";
import { Title } from "./TopBar/Title";

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
                <Ui.TopBar.Element name={"buttonBack"} group={"left"} element={<BackButton />} />
                <Ui.TopBar.Element name={"title"} group={"left"} element={<Title />} />
                <Ui.TopBar.Action name={"dropdownActions"} element={<PageOptionsDropdown />} />
                <Ui.Content.Element name={"breadcrumbs"} element={<Breadcrumbs />} />
                <Ui.Content.Element name={"background"} element={<Background />} />
                <Ui.Content.Element name={"preview"} element={<Preview />} />
                <Ui.Toolbar.Element
                    name={"insertElements"}
                    group={"tabs"}
                    element={<InsertElements />}
                />
                {/*<Ui.Toolbar.Element name={"navigator"} group={"top"} element={<Navigator />} />*/}
                {/*<Ui.Toolbar.Element
                    name={"savingIndicator"}
                    group={"bottom"}
                    element={<Saving />}
                />*/}
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
                {/* This element renders element actions. */}
                {/*<Ui.Sidebar.Element
                    name={"elementActions"}
                    group={"element"}
                    element={
                        <Ui.OnActiveElement>
                            <ElementActions />
                        </Ui.OnActiveElement>
                    }
                />*/}
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
