import React, { useCallback } from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { ReactComponent as AlignCenterIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_center.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_left.svg";
import { ReactComponent as AlignJustifyIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_justify.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/app-page-builder/editor/assets/icons/format_align_right.svg";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

type IconsType = {
    [key: string]: React.ReactElement;
};
// Icons map for dynamic render
const icons: IconsType = {
    left: <AlignLeftIcon />,
    center: <AlignCenterIcon />,
    right: <AlignRightIcon />,
    justify: <AlignJustifyIcon />
};

const defaultOptions = { alignments: Object.keys(icons) };

const defaultAlignValue = "left";

const getAlignValue = (element: PbElement, defaultAlign: string): string => {
    return element.data.settings?.horizontalAlign || defaultAlign;
};

type AlignTypesType = "left" | "center" | "right" | "justify";

type HorizontalAlignActionPropsType = {
    children: React.ReactElement;
    options: {
        alignments: string[];
    };
};
const HorizontalAlignAction: React.FunctionComponent<HorizontalAlignActionPropsType> = ({
    children,
    options: { alignments } = defaultOptions
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const align = getAlignValue(element, defaultAlignValue);

    const updateElement = (element: PbElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element
            })
        );
    };

    const onClick = useCallback(() => {
        const types = Object.keys(icons).filter(key =>
            alignments ? alignments.includes(key) : true
        );
        const nextAlign = (types[types.indexOf(align) + 1] || defaultAlignValue) as AlignTypesType;
        updateElement({
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...element.data.settings,
                    horizontalAlign: nextAlign
                }
            }
        });
    }, [element.id, align]);

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children as React.ReactElement, {
        onClick,
        icon: icons[align]
    });
};

export default React.memo(HorizontalAlignAction);
