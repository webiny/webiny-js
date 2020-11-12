import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { getPlugins } from "@webiny/plugins";
import { ReactComponent as AlignCenterIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_right.svg";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

// Icons map for dynamic render
const icons = {
    "flex-start": <AlignLeftIcon />,
    center: <AlignCenterIcon />,
    "flex-end": <AlignRightIcon />
};

enum AlignmentsTypeEnum {
    FLEX_START = "flex-start",
    CENTER = "center",
    FLEX_END = "flex-end"
}
const alignments = Object.keys(icons);

type HorizontalAlignActionFlexPropsType = {
    children: React.ReactElement;
};
const HorizontalAlignActionFlex: React.FunctionComponent<HorizontalAlignActionFlexPropsType> = ({
    children
}) => {
    const eventActionHandler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);

    const align = element.data?.settings?.horizontalAlignFlex || AlignmentsTypeEnum.CENTER;

    const onClick = () => {
        const nextAlign = (alignments[alignments.indexOf(align) + 1] ||
            AlignmentsTypeEnum.FLEX_START) as AlignmentsTypeEnum;

        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...(element.data.settings || {}),
                            horizontalAlignFlex: nextAlign
                        }
                    }
                }
            })
        );
    };

    const plugin = getPlugins<PbEditorPageElementPlugin>("pb-editor-page-element").find(
        pl => pl.elementType === element.type
    );

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick, icon: icons[align] });
};

export default React.memo(HorizontalAlignActionFlex);
