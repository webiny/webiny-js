import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { getPlugins } from "@webiny/plugins";
import { set } from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import { ReactComponent as AlignCenterIcon } from "./icons/round-border_horizontal-24px.svg";
import { ReactComponent as AlignTopIcon } from "./icons/round-border_top-24px.svg";
import { ReactComponent as AlignBottomIcon } from "./icons/round-border_bottom-24px.svg";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

// Icons map for dynamic render
const icons = {
    start: <AlignTopIcon />,
    center: <AlignCenterIcon />,
    end: <AlignBottomIcon />
};
type VerticalAlignActionPropsType = {
    children: React.ReactElement;
};
const VerticalAlignAction: React.FunctionComponent<VerticalAlignActionPropsType> = ({
    children
}) => {
    const eventActionHandler = useEventActionHandler();
    const element = useRecoilValue(activeElementSelector);

    const align = element.data?.settings?.verticalAlign || "start";

    const plugin = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element").find(
        pl => pl.elementType === element.type
    );

    const alignElement = React.useCallback(() => {
        const alignments = Object.keys(icons);
        const nextAlign = alignments[alignments.indexOf(align) + 1] || "start";

        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: set(element, "data.settings.verticalAlign", nextAlign)
            })
        );
    }, [align]);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick: alignElement, icon: icons[align] });
};

export default React.memo(VerticalAlignAction);
