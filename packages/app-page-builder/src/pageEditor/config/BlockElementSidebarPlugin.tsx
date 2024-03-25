import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { EditorSidebarTab } from "~/editor";
import { createDecorator } from "@webiny/app-admin";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ButtonPrimary } from "@webiny/ui/Button";
import UnlinkBlockAction from "~/pageEditor/plugins/elementSettings/UnlinkBlockAction";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";
import { updateSidebarActiveTabIndexMutation } from "~/editor/recoil/modules";
import { RootElement } from "~/editor/components/Editor/Sidebar/ElementSettingsTabContent";

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

const UnlinkTab = ({ permission }: UnlinkTabProps) => {
    return (
        <RootElement>
            <UnlinkBlockWrapper permission={permission}>
                This is a block element. To change it, you need to unlink it first. By unlinking it,
                any changes made to the block will no longer automatically reflect on this page.
                <div className="button-wrapper">
                    {permission ? (
                        <UnlinkBlockAction>
                            <ButtonPrimary>Unlink block</ButtonPrimary>
                        </UnlinkBlockAction>
                    ) : (
                        "No permissions."
                    )}
                </div>
                <div className="info-wrapper">
                    <InfoIcon />
                    <a
                        rel={"noreferrer"}
                        target={"_blank"}
                        href={
                            "https://youtu.be/_tbU3tu58v4?list=PL9HlKSQaEuXQdyCQDH_w7VQQcZbc67cPU"
                        }
                    >
                        Click here to learn more about how blocks work.
                    </a>
                </div>
            </UnlinkBlockWrapper>
        </RootElement>
    );
};

export const BlockElementSidebarPlugin = createDecorator(EditorSidebarTab, Tab => {
    return function ElementTab({ children, ...props }) {
        const [element] = useActiveElement();
        const [sidebar, setSidebar] = useElementSidebar();
        const [isTemplateMode] = useTemplateMode();

        const unlinkPermission = true;
        // TODO: check if the above check even works.
        // const unlinkPermission = useMemo((): boolean => {
        //     const permission = getPermission<PageBuilderSecurityPermission>("pb.block.unlink");
        //     if (permission?.name === "*" || permission?.name === "pb.*") {
        //         return true;
        //     }
        //     return Boolean(permission);
        // }, [identity]);

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
