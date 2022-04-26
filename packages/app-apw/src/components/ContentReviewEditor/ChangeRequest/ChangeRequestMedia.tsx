import React from "react";
import styled from "@emotion/styled";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as OpenInFullIcon } from "~/assets/icons/open_in_full_24dp.svg";
import { ApwMediaFile } from "~/types";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-apw/content-reviews/editor/steps/changeRequest");

const OpenInFullButton = styled(IconButton)<{ fullWidth?: boolean }>`
    position: absolute;
    top: ${props => (props.fullWidth ? "0px" : "-12px")};
    right: ${props => (props.fullWidth ? "0px" : "-12px")};
    opacity: 0;
    z-index: 1;
`;

export const Media = styled.div<{ fullWidth?: boolean }>`
    width: ${props => (props.fullWidth ? "100%" : "150px")};
    height: ${props => (props.fullWidth ? "100%" : "104px")};
    border-radius: 4px;
    margin: 0 auto;
    position: relative;

    &:hover::after {
        opacity: 1;
        z-index: 0;
    }

    &:hover button {
        opacity: 1;
    }

    &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
        z-index: -1;
        width: 100%;
        height: 100%;
        transform: ${props => (props.fullWidth ? "none" : "scale(1.25)")};
        background-color: rgba(0, 0, 0, 0.45);
        transition: all 150ms ease-in-out;
        border-radius: 4px;
    }
`;

interface FileWithOverlayProps {
    media: ApwMediaFile;
    fullWidth: boolean;
}

export const FileWithOverlay: React.FC<FileWithOverlayProps> = ({ media, children, fullWidth }) => {
    return (
        <Media fullWidth={fullWidth}>
            {children}

            <OpenInFullButton
                fullWidth={fullWidth}
                icon={
                    <Tooltip content={t`Open file in new tab`}>
                        <OpenInFullIcon style={{ fill: "var(--mdc-theme-background)" }} />
                    </Tooltip>
                }
                onClick={() => window.open(media.src, "_blank", "noopener")}
            />
        </Media>
    );
};
