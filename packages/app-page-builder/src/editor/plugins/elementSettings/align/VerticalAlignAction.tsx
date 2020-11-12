import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
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
const alignments = Object.keys(icons);
enum AlignTypesEnum {
    START = "start",
    CENTER = "center",
    END = "end"
}
type VerticalAlignActionPropsType = {
    children: React.ReactElement;
};
const VerticalAlignAction: React.FunctionComponent<VerticalAlignActionPropsType> = ({
    children
}) => {
    const eventActionHandler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);

    const align = element?.data?.settings?.verticalAlign || AlignTypesEnum.START;

    const alignElement = React.useCallback(() => {
        const nextAlign = (alignments[alignments.indexOf(align) + 1] ||
            AlignTypesEnum.START) as AlignTypesEnum;

        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...element.data.settings,
                            verticalAlign: nextAlign
                        }
                    }
                }
            })
        );
    }, [align]);

    if (!element) {
        return null;
    }
    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick: alignElement, icon: icons[align] });
};

export default React.memo(VerticalAlignAction);
