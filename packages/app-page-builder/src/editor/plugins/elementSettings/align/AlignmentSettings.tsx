import React from "react";
import { plugins } from "@webiny/plugins";
import { css } from "emotion";
import classNames from "classnames";
import { useRecoilValue } from "recoil";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import {
    PbEditorPageElementPlugin,
    PbElement,
    PbElementDataIconType,
    PbElementDataImageType,
    PbElementDataSettingsBackgroundType,
    PbElementDataSettingsBorderType,
    PbElementDataSettingsFormType,
    PbElementDataSettingsMarginType,
    PbElementDataSettingsPaddingType,
    AlignmentTypesEnum
} from "@webiny/app-page-builder/types";
import { AccordionItem } from "@webiny/ui/Accordion";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
// Icons
import { ReactComponent as AlignCenterIcon } from "../../../assets/icons/format_align_center.svg";
import { ReactComponent as AlignHorizontalLeftIcon } from "../../../assets/icons/align_horizontal_left.svg";
import { ReactComponent as AlignHorizontalCenterIcon } from "../../../assets/icons/align_horizontal_center.svg";
import { ReactComponent as AlignHorizontalRightIcon } from "../../../assets/icons/align_horizontal_right.svg";
import { ReactComponent as AlignVerticalTopIcon } from "../../../assets/icons/align_vertical_top.svg";
import { ReactComponent as AlignVerticalCenterIcon } from "../../../assets/icons/align_vertical_center.svg";
import { ReactComponent as AlignVerticalBottomIcon } from "../../../assets/icons/align_vertical_bottom.svg";
// Components
import { ContentWrapper } from "../components/StyledComponents";

const classes = {
    activeIcon: css({
        "&.mdc-icon-button": {
            color: "var(--mdc-theme-primary)"
        }
    }),
    icon: css({
        "&.mdc-icon-button": {
            color: "var(--mdc-theme-text-primary-on-background)"
        }
    })
};

type IconsType = {
    [key: string]: React.ReactElement;
};
// Icons map for dynamic render
const icons: IconsType = {
    horizontalLeft: <AlignHorizontalLeftIcon />,
    horizontalCenter: <AlignHorizontalCenterIcon />,
    horizontalRight: <AlignHorizontalRightIcon />,
    verticalTop: <AlignVerticalTopIcon />,
    verticalCenter: <AlignVerticalCenterIcon />,
    verticalBottom: <AlignVerticalBottomIcon />
};

const iconDescriptions = {
    horizontalLeft: "Align horizontal left",
    horizontalCenter: "Align horizontal center",
    horizontalRight: "Align horizontal right",
    verticalTop: "Align vertical top",
    verticalCenter: "Align vertical center",
    verticalBottom: "Align vertical bottom"
};

const defaultOptions = { alignments: Object.keys(icons) };

const defaultAlignValue = AlignmentTypesEnum.HORIZONTAL_LEFT;

const getAlignValue = (element: PbElement, defaultAlign: string): string => {
    return element.data.settings?.alignment || defaultAlign;
};

type HorizontalAlignActionPropsType = {
    options: {
        alignments: string[];
    };
};
const AlignmentSettings: React.FunctionComponent<HorizontalAlignActionPropsType> = ({
    options: { alignments } = defaultOptions
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const align = getAlignValue(element, defaultAlignValue);

    const updateElement = (element: {
        [p: string]: any;
        path: string;
        data: {
            [p: string]: any;
            settings: {
                [p: string]: any;
                border?: PbElementDataSettingsBorderType;
                horizontalAlignFlex?: "flex-start" | "center" | "flex-end";
                verticalAlign?: "start" | "center" | "end";
                padding?: PbElementDataSettingsPaddingType;
                margin?: PbElementDataSettingsMarginType;
                className?: string;
                form?: PbElementDataSettingsFormType;
                alignment?: AlignmentTypesEnum;
                background?: PbElementDataSettingsBackgroundType;
                grid?: { cellsType?: string; size?: number };
                width?: { value?: string };
                columnWidth?: { value?: string };
                height?: { value?: number };
            };
            image?: PbElementDataImageType;
            oembed?: { source?: { url?: string }; html?: string };
            link?: { href?: string; newTab?: boolean };
            icon?: PbElementDataIconType;
            width?: number;
            text?: any;
            source?: { url?: string };
            type?: string;
        };
        elements: PbElement[];
        id: string;
        type: string;
    }) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element
            })
        );
    };

    const onClick = (type: AlignmentTypesEnum = defaultAlignValue) => {
        updateElement({
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...element.data.settings,
                    alignment: type
                }
            }
        });
    };

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return (
        <AccordionItem
            icon={<AlignCenterIcon />}
            title={"Alignment"}
            description={"Align the inner content of an element."}
        >
            <ContentWrapper>
                {defaultOptions.alignments.map(type => (
                    <Tooltip key={type} content={iconDescriptions[type]} placement={"top"}>
                        <IconButton
                            className={classNames({
                                [classes.activeIcon]: align === type,
                                [classes.icon]: align !== type
                            })}
                            disabled={!alignments.includes(type)}
                            icon={icons[type]}
                            onClick={() => onClick(type as AlignmentTypesEnum)}
                        />
                    </Tooltip>
                ))}
            </ContentWrapper>
        </AccordionItem>
    );
};

export default React.memo(AlignmentSettings);
