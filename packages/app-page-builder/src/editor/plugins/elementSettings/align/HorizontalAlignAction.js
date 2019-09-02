// @flow
import React, { useCallback } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPlugins } from "@webiny/plugins";
import { set } from "dot-prop-immutable";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { get } from "dot-prop-immutable";
import { ReactComponent as AlignCenterIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignJustifyIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_justify.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_right.svg";

// Icons map for dynamic render
const icons = {
    left: <AlignLeftIcon />,
    center: <AlignCenterIcon />,
    right: <AlignRightIcon />,
    justify: <AlignJustifyIcon />
};

const defaultOptions = { alignments: ["left", "center", "right", "justify"] };

const HorizontalAlignAction = ({
    element,
    children,
    updateElement,
    options: { alignments } = defaultOptions
}: Object) => {
    const align = get(element, "data.settings.horizontalAlign") || "left";

    const onClick = useCallback(() => {
        const types = Object.keys(icons).filter(key =>
            alignments ? alignments.includes(key) : true
        );

        const nextAlign = types[types.indexOf(align) + 1] || "left";

        updateElement({
            element: set(element, "data.settings.horizontalAlign", nextAlign)
        });
    }, [element, align]);

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick, icon: icons[align] });
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(HorizontalAlignAction);
