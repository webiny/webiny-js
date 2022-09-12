import React from "react";
import styled from "@emotion/styled";
import { EditorSidebarTab } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ButtonPrimary } from "@webiny/ui/Button";
import UnlinkBlockAction from "~/pageEditor/plugins/elementSettings/UnlinkBlockAction";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";

const UnlinkBlockWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px",
    justifyContent: "center",
    alignItems: "center",
    margin: "16px",
    textAlign: "center",
    backgroundColor: "var(--mdc-theme-background)",
    border: "3px dashed var(--webiny-theme-color-border)",
    borderRadius: "5px",
    "& .info-wrapper": {
        display: "flex",
        alignItems: "center",
        fontSize: "10px",
        "& svg": {
            width: "18px",
            marginRight: "5px"
        }
    }
});

const UnlinkTab = () => {
    return (
        <UnlinkBlockWrapper>
            This is a block element - to change it you need to unlink it first. By unlinking it, any
            changes made to the block will no longer automatically reflect to this page.
            <div>
                <UnlinkBlockAction>
                    <ButtonPrimary>Unlink block</ButtonPrimary>
                </UnlinkBlockAction>
            </div>
            <div className="info-wrapper">
                <InfoIcon /> Click here to learn more about how block work
            </div>
        </UnlinkBlockWrapper>
    );
};

export const BlockElementSidebarPlugin = createComponentPlugin(EditorSidebarTab, Tab => {
    return function ElementTab({ children, ...props }) {
        const [element] = useActiveElement();

        return (
            <Tab {...props}>
                {element !== null && element.type === "block" && element.data?.blockId ? (
                    <UnlinkTab />
                ) : (
                    children
                )}
            </Tab>
        );
    };
});
