//@flow
import React from "react";
import { dispatch } from "webiny-app/redux";
import { updateElement } from "webiny-app-cms/editor/actions";
import { get, set } from "dot-prop-immutable";
import { ReactComponent as AlignCenterIcon } from "webiny-app-cms/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "webiny-app-cms/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignJustifyIcon } from "webiny-app-cms/editor/assets/icons/format_align_justify.svg";
import { ReactComponent as AlignRightIcon } from "webiny-app-cms/editor/assets/icons/format_align_right.svg";
import Action from "../Action";

// Icons map for dynamic render
const icons = {
    left: AlignLeftIcon,
    center: AlignCenterIcon,
    right: AlignRightIcon,
    justify: AlignJustifyIcon
};

// Alignment types for faster access
const alignments = Object.keys(icons);

export default {
    name: "cms-element-settings-align",
    type: "cms-element-settings",
    renderAction({ parent, element }: Object) {
        const align = get(element, "settings.style.textAlign") || "left";
        const nextAlign = alignments[alignments.indexOf(align) + 1] || "left";

        return (
            <Action
                tooltip={"Align content"}
                onClick={() => {
                    dispatch(
                        updateElement({
                            element: set(element, "settings.style.textAlign", nextAlign)
                        })
                    );
                }}
                icon={React.createElement(icons[align])}
            />
        );
    }
};
