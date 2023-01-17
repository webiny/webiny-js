import React, { useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import { EditorSidebarTab } from "~/editor";
import { createComponentPlugin } from "@webiny/app-admin";
import { useSecurity } from "@webiny/app-security";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ButtonPrimary } from "@webiny/ui/Button";
import UnlinkBlockAction from "~/pageEditor/plugins/elementSettings/UnlinkBlockAction";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { updateSidebarActiveTabIndexMutation } from "~/editor/recoil/modules";
import { RootElement } from "~/editor/components/Editor/Sidebar/ElementSettingsTabContent";
import { PageBuilderSecurityPermission } from "~/types";

type UnlinkBlockWrapperProps = {
    permission: boolean;
};

const UnlinkBlockWrapper = styled("div")<UnlinkBlockWrapperProps>`
    padding: 16px;
    display: grid;
    row-gap: 16px;
    justify-content: center;
    align-items: center;
    margin: auto 16px 16px 16px;
    text-align: center;
    background-color: var(--mdc-theme-background);
    border: 3px dashed var(--webiny-theme-color-border);
    border-radius: 5px;
    opacity: ${props => !props.permission && "0.5"};

    & .button-wrapper {
        font-weight: bold;
    }

    & .info-wrapper {
        display: flex;
        align-items: center;
        font-size: 10px;

        & svg {
            width: 18px;
            margin-right: 5px;
        }
    }
`;

type UnlinkTabProps = {
    permission: boolean;
};

const UnlinkTab: React.FC<UnlinkTabProps> = ({ permission }) => {
    return (
        <RootElement>
            <UnlinkBlockWrapper permission={permission}>
                This is a block element - to change it you need to unlink it first. By unlinking it,
                any changes made to the block will no longer automatically reflect to this page.
                <div className="button-wrapper">
                    {permission ? (
                        <UnlinkBlockAction>
                            <ButtonPrimary>Unlink block</ButtonPrimary>
                        </UnlinkBlockAction>
                    ) : (
                        "No permissions"
                    )}
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
        const { identity, getPermission } = useSecurity();
        const [isTemplateMode] = useTemplateMode();

        const unlinkPermission = useMemo((): boolean => {
            const permission = getPermission<PageBuilderSecurityPermission>("pb.block");
            if (permission?.name === "*" || permission?.name === "pb.*") {
                return true;
            }
            return permission?.unlink || false;
        }, [identity]);

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

        if (isTemplateMode) {
            return isStyleTab ? null : <>{children}</>;
        }

        return (
            <Tab {...props}>
                {isReferenceBlock && isStyleTab ? (
                    <UnlinkTab permission={unlinkPermission} />
                ) : (
                    children
                )}
            </Tab>
        );
    };
});
