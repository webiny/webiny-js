import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { EditorSidebarTab } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ButtonPrimary } from "@webiny/ui/Button";
import UnlinkBlockAction from "~/pageEditor/plugins/elementSettings/UnlinkBlockAction";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";
import { updateSidebarActiveTabIndexMutation } from "~/editor/recoil/modules";
import { RootElement } from "~/editor/components/Editor/Sidebar/ElementSettingsTabContent";

const UnlinkBlockWrapper = styled("div")({
    padding: "16px",
    display: "grid",
    rowGap: "16px",
    justifyContent: "center",
    alignItems: "center",
    margin: "auto 16px 16px 16px",
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
        <RootElement>
            <UnlinkBlockWrapper>
                This is a block element - to change it you need to unlink it first. By unlinking it,
                any changes made to the block will no longer automatically reflect to this page.
                <div>
                    <UnlinkBlockAction>
                        <ButtonPrimary>Unlink block</ButtonPrimary>
                    </UnlinkBlockAction>
                </div>
                <div className="info-wrapper">
                    <InfoIcon /> Click here to learn more about how block work
                </div>
            </UnlinkBlockWrapper>
        </RootElement>
    );
};

export const BlockElementSidebarPlugin = createComponentPlugin(EditorSidebarTab, Tab => {
    return function ElementTab({ children, ...props }) {
        const [element] = useActiveElement();
        const [sidebar, setSidebar] = useElementSidebar();

        const isReferenceBlock =
            element !== null && element.type === "block" && !!element.data?.blockId;
        const isStyleTab = props?.label === "Style";

        useEffect(() => {
            if (isReferenceBlock) {
                setSidebar(prev => updateSidebarActiveTabIndexMutation(prev, 1));
            } else if (sidebar.activeTabIndex === 1) {
                setSidebar(prev => updateSidebarActiveTabIndexMutation(prev, 0));
            }
        }, [element?.id]);

        return <Tab {...props}>{isReferenceBlock && isStyleTab ? <UnlinkTab /> : children}</Tab>;
    };
});
