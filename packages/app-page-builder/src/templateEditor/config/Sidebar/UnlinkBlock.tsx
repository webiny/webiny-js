import React from "react";
import styled from "@emotion/styled";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { ButtonPrimary } from "@webiny/ui/Button";
import UnlinkBlockAction from "~/pageEditor/plugins/elementSettings/UnlinkBlockAction";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import { TemplateEditorConfig } from "~/templateEditor/editorConfig/TemplateEditorConfig";

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
        <UnlinkBlockWrapper permission={permission}>
            This is a block element - to change it you need to unlink it first. By unlinking it, any
            changes made to the block will no longer automatically reflect to this template.
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
    );
};

export const UnlinkBlock = TemplateEditorConfig.Sidebar.Elements.createDecorator(Original => {
    return function SidebarElements(props) {
        const [element] = useActiveElement();

        if (!element || props.group !== "style") {
            return <Original {...props} />;
        }

        const isReferenceBlock = element.type === "block" && !!element.data?.blockId;

        if (isReferenceBlock) {
            return <UnlinkTab permission={true} />;
        }

        return <Original {...props} />;
    };
});
