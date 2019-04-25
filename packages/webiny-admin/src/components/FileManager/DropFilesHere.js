// @flow
import React from "react";
import { css } from "emotion";
import { Icon } from "webiny-ui/Icon";

import { ReactComponent as UploadIcon } from "./icons/round-cloud_upload-24px.svg";

const styles = css({
    margin: "0 auto",
    paddingTop: 0,
    height: "100%",
    zIndex: 2,
    width: "100%",
    position: "absolute",
    backgroundColor: "var(--mdc-theme-text-hint-on-light)",
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
            "svg.mdc-button__icon": {
                width: 100,
                display: "inline-block",
                color: "var(--mdc-theme-on-surface)"
            }
        }
    }
});

type Props = {
    onDragLeave?: Function,
    onDrop?: Function
};

export default function DropFilesHere({ onDrop, onDragLeave }: Props) {
    return (
        <div className={styles} onDrop={onDrop} onDragLeave={onDragLeave}>
            <div>
                <div>
                    <Icon icon={<UploadIcon />} />
                    <div>Drop files here</div>
                </div>
            </div>
        </div>
    );
}
