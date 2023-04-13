import React from "react";
import mime from "mime/lite";
import styled from "@emotion/styled";
import SupportedFileTypes, { SupportedFileTypesProps } from "./BottomInfoBar/SupportedFileTypes";
import ListStatus, { ListStatusProps } from "./BottomInfoBar/ListStatus";

mime.define({ "image/x-icon": ["ico"] }, true);
mime.define({ "image/jpg": ["jpg"] }, true);
mime.define({ "image/vnd.microsoft.icon": ["ico"] }, true);

const BottomInfoBarWrapper = styled("div")({
    fontSize: "0.8rem",
    position: "sticky",
    bottom: 0,
    height: 30,
    color: "var(--mdc-theme-text-secondary-on-background)",
    borderTop: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "var(--mdc-theme-surface)",
    width: "100%",
    transform: "translateZ(0)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    zIndex: 1,
    "> div": {
        padding: "0 10px",
        width: "100%"
    }
});

const BottomInfoBar: React.FC<SupportedFileTypesProps & ListStatusProps> = props => {
    return (
        <BottomInfoBarWrapper>
            <div>
                <SupportedFileTypes {...props} />
                <ListStatus {...props} />
            </div>
        </BottomInfoBarWrapper>
    );
};

export default BottomInfoBar;
