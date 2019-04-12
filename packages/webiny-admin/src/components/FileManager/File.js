// @flow
import React from "react";
import { css } from "emotion";
import { ReactComponent as Checked } from "./icons/round-check_box-24px.svg";
import { ReactComponent as NotChecked } from "./icons/round-check_box_outline_blank-24px.svg";
import { ReactComponent as More } from "./icons/round-more_vert-24px.svg";
import { ReactComponent as Details } from "./icons/round-description-24px.svg";
import { Menu, MenuItem } from "webiny-ui/Menu";
import { Ripple } from "webiny-ui/Ripple";
import { ListItemGraphic } from "webiny-ui/List";

const COMPONENT_WIDTH = 200;
const COMPONENT_HEIGHT = 200;

const styles = css({
    display: "inline-block",
    float: "left",
    position: "relative",
    margin: 10,
    cursor: "pointer",
    width: COMPONENT_WIDTH,
    "> .body": {
        border: "1px solid #cccccc",
        width: COMPONENT_WIDTH,
        height: COMPONENT_HEIGHT,
        overflow: "hidden",
        ".checkedIcon": {
            color: "var(--mdc-theme-primary, #00ccb0)",
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 10
        },
        ".optionsIcon": {
            color: "var(--mdc-theme-primary, #00ccb0)",
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 10
        },
        ".filePreview": {
            textAlign: "center",
            position: "relative",
            ".clickableArea": {
                position: "absolute",
                top: 30,
                left: 0,
                width: "100%",
                height: 170
            }
        }
    },
    "> .label": {
        padding: "7px 0px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }
});

type Props = {
    file: Object,
    selected: boolean,
    uploadFile: Function,
    onSelect: Function,
    onClick: Function,
    options: ?Array<{ label: string, onClick: (file: Object) => void }>
};

function renderViewDetails({ MenuItem, MenuItemIcon, showFileDetails }) {
    return (
        <MenuItem onClick={showFileDetails}>
            <MenuItemIcon>
                <Details />
            </MenuItemIcon>
            Details
        </MenuItem>
    );
}

export default function File(props: Props) {
    const { file, selected, onSelect, children, uploadFile, showFileDetails, options = [] } = props;

    const menu = [renderViewDetails, ...options];
    return (
        <div className={styles}>
            <div className={"body"}>
                <div className={"checkedIcon"} onClick={onSelect}>
                    {selected ? <Checked /> : <NotChecked />}
                </div>
                <div className={"optionsIcon"}>
                    <Menu handle={<More />}>
                        {menu.map((item, index) => (
                            <React.Fragment key={index}>
                                {item({
                                    file,
                                    MenuItem,
                                    MenuItemIcon: ListItemGraphic,
                                    uploadFile,
                                    showFileDetails
                                })}
                            </React.Fragment>
                        ))}
                    </Menu>
                </div>
                <Ripple>
                    <div className={"filePreview"}>
                        <div className="clickableArea" onClick={onSelect} />
                        {children}
                    </div>
                </Ripple>
            </div>
            <div className={"label"}>{file.name}</div>
        </div>
    );
}
