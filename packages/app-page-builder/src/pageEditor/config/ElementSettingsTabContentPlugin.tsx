import React from "react";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/round/edit.svg";
import { ReactComponent as RefreshIcon } from "@material-design-icons/svg/round/refresh.svg";
import { SidebarActions } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import Action from "~/editor/plugins/elementSettings/components/Action";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import useElementSettings from "~/editor/plugins/elementSettings/hooks/useElementSettings";
import { useRefreshBlock } from "~/editor/hooks/useRefreshBlock";
import VariableSettings from "~/editor/plugins/elementSettings/variable/VariableSettings";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { PbEditorElement } from "~/types";

export const ElementSettingsTabContentPlugin = createComponentPlugin(
    SidebarActions,
    SidebarActionsWrapper => {
        return function SettingsTabContent({ children, ...props }) {
            const [element] = useActiveElement();
            const elementSettings = useElementSettings();
            const [isTemplateMode] = useTemplateMode();
            const refreshBlock = useRefreshBlock(element as PbEditorElement);

            if (isTemplateMode) {
                return <VariableSettings />;
            }

            const isReferenceBlockElement = element?.data?.blockId;

            return (
                <>
                    <SidebarActionsWrapper {...props}>
                        {isReferenceBlockElement ? (
                            <>
                                {elementSettings.map(({ plugin, options }, index) => {
                                    return (
                                        <div key={plugin.name + "-" + index}>
                                            {typeof plugin.renderAction === "function" &&
                                                plugin.name !==
                                                    "pb-editor-page-element-settings-save" &&
                                                plugin.renderAction({ options })}
                                        </div>
                                    );
                                })}
                                <Action
                                    tooltip={"Edit block"}
                                    icon={<EditIcon />}
                                    onClick={() =>
                                        window.open(
                                            `/page-builder/block-editor/${element?.data?.blockId}`,
                                            "_blank",
                                            "noopener"
                                        )
                                    }
                                />
                                <Action
                                    tooltip={"Refresh block"}
                                    onClick={refreshBlock}
                                    icon={<RefreshIcon />}
                                />
                            </>
                        ) : (
                            children
                        )}
                    </SidebarActionsWrapper>
                    {isReferenceBlockElement && <VariableSettings />}
                </>
            );
        };
    }
);
