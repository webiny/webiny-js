import React from "react";
import LazyLoad from "react-lazy-load";
import { css, keyframes } from "emotion";
import { Ripple } from "@webiny/ui/Ripple";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as Checked } from "./icons/round-check_box-24px.svg";
import { ReactComponent as SettingsIcon } from "../../assets/icons/round-settings-24px.svg";

const COMPONENT_WIDTH = 200;
const COMPONENT_HEIGHT = 200;

const grow = keyframes`
  0% {
    transform: scale(1)
  }
  50% {
    transform: scale(1.2)
  }
  100% {
    transform: scale(1)
  }
`;
const styles = css({
    display: "inline-block",
    float: "left",
    position: "relative",
    zIndex: 1,
    margin: 10,
    cursor: "pointer",
    width: "100%",
    maxWidth: COMPONENT_WIDTH,
    border: "1px solid var(--mdc-theme-on-background)",
    borderRadius: 2,
    "> .body": {
        width: COMPONENT_WIDTH,
        height: COMPONENT_HEIGHT,
        overflow: "hidden",
        "--icon-color": "var(--mdc-theme-on-background)",
        ".checkedIcon": {
            color: "var(--mdc-theme-secondary)",
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 11
        },
        ".infoIcon": {
            opacity: 0,
            position: "absolute",
            top: 0,
            right: 0,
            zIndex: 10,
            transition: "all 150ms ease-in",
            "& .mdc-icon-button svg": {
                color: "var(--mdc-theme-secondary)"
            }
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
        },
        "&:hover .infoIcon": {
            opacity: 1,
            animationName: grow,
            animationDuration: ".4s",
            animationTimingFunction: "ease-in-out",
            animationDelay: ".2s"
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

type Props = {
    file: { [key: string]: any };
    selected: boolean;
    uploadFile: Function;
    onSelect: (event?: React.MouseEvent) => void;
    onClick: (event?: React.MouseEvent) => void;
    options?: Array<{ label: string; onClick: (file: Object) => void }>;
    children: React.ReactNode;
    showFileDetails: (event?: React.MouseEvent) => void;
};

export default React.memo(
    function File(props: Props) {
        const { file, selected, onSelect, children, showFileDetails } = props;

        return (
            <div className={styles} data-testid={"fm-list-wrapper-file"}>
                <div className={"body"}>
                    <div className={"checkedIcon"} onClick={onSelect}>
                        {selected ? <Checked /> : null}
                    </div>
                    <div className={"infoIcon"}>
                        <IconButton
                            icon={<SettingsIcon />}
                            onClick={showFileDetails}
                            data-testid={"fm-file-wrapper-file-info-icon"}
                        />
                    </div>
                    <LazyLoad height={200} offsetVertical={300}>
                        <Ripple>
                            <div className={"filePreview"}>
                                <div className="clickableArea" onClick={onSelect} />
                                {children}
                            </div>
                        </Ripple>
                    </LazyLoad>
                </div>
                <div className={"label"} onClick={onSelect}>
                    {file.name}
                </div>
            </div>
        );
    },
    (prev, next) => {
        if (prev.selected !== next.selected) {
            return false;
        }

        if (prev.file.name !== next.file.name) {
            return false;
        }

        return true;
    }
);
