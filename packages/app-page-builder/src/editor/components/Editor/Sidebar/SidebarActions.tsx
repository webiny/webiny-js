import React from "react";
import styled from "@emotion/styled";
import { plugins } from "@webiny/plugins";
import useElementSettings from "../../../plugins/elementSettings/bar/useElementSettings";
import { PbEditorSidebarContentPlugin, PbElement } from "../../../../types";

const SidebarActionsWrapper = styled("div")({
    display: "flex",
    flexWrap: "wrap",
    borderBottom: "1px solid rgb(234,233,234)"
});

const SidebarActions = ({ element }: { element: PbElement }) => {
    const elementSettings = useElementSettings();
    const sidebarContentPlugins = plugins.byType<PbEditorSidebarContentPlugin>(
        "pb-editor-sidebar-content"
    );

    return (
        <React.Fragment>
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
        </React.Fragment>
    );
};

export default React.memo(SidebarActions);
