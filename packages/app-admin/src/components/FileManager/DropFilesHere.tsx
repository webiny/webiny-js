import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/outlined/cloud_upload.svg";

const styles = css({
    margin: "0 auto",
    paddingTop: 0,
    height: "100%",
    zIndex: 2,
    width: "100%",
    position: "absolute",
    backgroundColor: "var(--mdc-theme-text-hint-on-light)",
    "&.empty": {
        backgroundColor: "transparent",
        "> div": {
            backgroundColor: "var(--mdc-theme-surface)"
        }
    },
    "> div": {
        textAlign: "center",
        width: 300,
        height: 300,
        backgroundColor: "var(--mdc-theme-background)",
        borderRadius: "50%",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translateX(-50%) translateY(-100%)",
        "> div": {
            position: "absolute",
            top: 90,
            width: 300,
            color: "var(--mdc-theme-on-surface)",
            "svg.mdc-button__icon": {
                width: 100,
                display: "inline-block",
                color: "var(--mdc-theme-on-surface)"
            }
        }
    }
});

export interface DropFilesHereProps {
    onDragLeave?: (event?: React.DragEvent<HTMLElement>) => void;
    onDrop?: (event?: React.DragEvent<HTMLElement>) => void;
    empty?: boolean;
    onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
}

const DropFilesHere: React.FC<DropFilesHereProps> = ({ onDrop, onDragLeave, empty, onClick }) => {
    return (
        <div
            className={classNames(styles, { empty })}
            onDrop={onDrop}
            onClick={onClick}
            onDragLeave={onDragLeave}
        >
            <div>
                <div>
                    <Icon icon={<UploadIcon />} />
                    <div>Drop files here</div>
                </div>
            </div>
        </div>
    );
};
export default DropFilesHere;
