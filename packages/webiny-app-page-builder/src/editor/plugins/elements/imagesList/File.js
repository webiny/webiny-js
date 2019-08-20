// @flow
import React from "react";
import { css } from "emotion";
import { Image } from "webiny-app/components";
import { ReactComponent as RemoveIcon } from "webiny-app-page-builder/admin/assets/round-close-24px.svg";

const COMPONENT_WIDTH = 176;
const COMPONENT_HEIGHT = 176;

const styles = css({
    cursor: "move",
    display: "inline-block",
    float: "left",
    position: "relative",
    zIndex: 1,
    margin: 10,
    width: "100%",
    maxWidth: COMPONENT_WIDTH,
    border: "1px solid var(--mdc-theme-on-background)",
    borderRadius: 2,
    "> .body": {
        width: COMPONENT_WIDTH,
        height: COMPONENT_HEIGHT,
        overflow: "hidden",
        "--icon-color": "var(--mdc-theme-on-background)",
        "&:hover": {
            "--icon-color": "var(--mdc-theme-secondary)"
        },
        ".infoIcon": {
            color: "var(--icon-color)",
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 10
        },
        ".filePreview": {
            textAlign: "center",
            position: "relative",
            backgroundColor: "#fff",
            width: "100%",
            height: "100%",
            ".clickableArea": {
                position: "absolute",
                top: 30,
                left: 0,
                width: "100%",
                height: 170,
                zIndex: 2
            }
        }
    },
    "> .label": {
        padding: "15px 10px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontSize: "0.8rem",
        color: "var(--mdc-theme-on-surface)",
        backgroundColor: "var(--mdc-theme-on-background)"
    }
});

const imageStyles = css({
    maxHeight: COMPONENT_HEIGHT,
    maxWidth: COMPONENT_WIDTH,
    width: "auto",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translateX(-50%) translateY(-50%)"
});

type Props = {
    file: Object,
    selected: boolean,
    uploadFile: Function,
    onSelect: Function,
    onClick: Function,
    options: ?Array<{ label: string, onClick: (file: Object) => void }>
};

export default function File(props: Props) {
    const { file, onSelect, onRemove } = props;

    return (
        <div className={styles}>
            <div className={"body"}>
                <div className={"infoIcon"}>
                    <RemoveIcon onClick={onRemove} />
                </div>
                <div className={"filePreview"}>
                    <div className="clickableArea" onClick={onSelect} />
                    <Image
                        className={imageStyles}
                        src={file.src}
                        alt={file.name}
                        transform={{ width: 300 }}
                    />
                </div>
            </div>
            <div className={"label"}>{file.name}</div>
        </div>
    );
}
