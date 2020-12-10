import React from "react";
import styled from "@emotion/styled";
import { plugins } from "@webiny/plugins";
import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";
import { PbEditorSidebarContentPlugin } from "../../../../types";

const RootElement = styled("div")({
    height: "calc(100vh - 65px - 48px)", // Subtract top-bar and tab-header height
    overflowY: "auto",
    // Style scrollbar
    "&::-webkit-scrollbar": {
        width: 1
    },
    "&::-webkit-scrollbar-track": {
        boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "darkgrey",
        outline: "1px solid slategrey"
    }
});

const SidebarActionsWrapper = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    borderBottom: "1px solid rgb(234,233,234)"
});

const ElementSettingsTabContent = ({ element }) => {
    const elementSettings = useElementSettings();
    const sidebarContentPlugins = plugins.byType<PbEditorSidebarContentPlugin>(
        "pb-editor-sidebar-content"
    );

    if (!element) {
        return null;
    }

    return (
        <RootElement>
            <SidebarActionsWrapper>
                {elementSettings
                    // FIXME: Remove this after element settings cleanup.
                    .filter(
                        ({ plugin }) =>
                            plugin.name.includes("delete") || plugin.name.includes("clone")
                    )
                    .map(({ plugin, options }, index) => {
                        return (
                            <div key={plugin.name + "-" + index}>
                                {typeof plugin.renderAction === "function" &&
                                    plugin.renderAction({ options })}
                            </div>
                        );
                    })}
            </SidebarActionsWrapper>
            {/* TODO: Convert "Save" to "element settings" */}
            {elementSettings.map(({ plugin, options }, index) => {
                return (
                    <div key={plugin.name + "-" + index}>
                        {typeof plugin.renderElement === "function" &&
                            plugin.renderElement({ options })}
                    </div>
                );
            })}
            {sidebarContentPlugins.map((plugin, index) => {
                return React.cloneElement(plugin.render(), { key: index, element });
            })}
        </RootElement>
    );
};

export default React.memo(ElementSettingsTabContent);
