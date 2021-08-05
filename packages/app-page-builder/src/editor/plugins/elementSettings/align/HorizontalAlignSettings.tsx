import React from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import { plugins } from "@webiny/plugins";
import {
    PbEditorPageElementPlugin,
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps
} from "../../../../types";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";
// Components
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
// Icons
import { ReactComponent as AlignTextLeftIcon } from "./icons/format_align_left.svg";
import { ReactComponent as AlignTextCenterIcon } from "./icons/format_align_center.svg";
import { ReactComponent as AlignTextRightIcon } from "./icons/format_align_right.svg";
import { ReactComponent as AlignTextJustifyIcon } from "./icons/format_align_justify.svg";

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
    left: <AlignTextLeftIcon />,
    center: <AlignTextCenterIcon />,
    right: <AlignTextRightIcon />,
    justify: <AlignTextJustifyIcon />
};

const iconDescriptions = {
    left: "Align left",
    center: "Align center",
    right: "Align right",
    justify: "Align justify"
};

const defaultAlignValue = "left";
const DEFAULT_ALIGNMENTS = Object.keys(icons);

const getAlignValue = (element: PbEditorElement, defaultAlign: string): string => {
    return element.data.settings?.horizontalAlign || defaultAlign;
};

type AlignTypesType = "left" | "center" | "right" | "justify";

type HorizontalAlignActionPropsType = {
    options: {
        alignments: string[];
    };
};
const HorizontalAlignSettings: React.FunctionComponent<
    HorizontalAlignActionPropsType & PbEditorPageElementSettingsRenderComponentProps
> = ({ options: { alignments = DEFAULT_ALIGNMENTS }, defaultAccordionValue }) => {
    const handler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const align = getAlignValue(element, defaultAlignValue);

    const updateElement = (element: PbEditorElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element,
                history: true
            })
        );
    };

    const onClick = (type: AlignTypesType = defaultAlignValue) => {
        updateElement({
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...element.data.settings,
                    horizontalAlign: type
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
        <Accordion title={"Text align"} defaultValue={defaultAccordionValue}>
            <ContentWrapper>
                {alignments.map(type => (
                    <Tooltip key={type} content={iconDescriptions[type]} placement={"top"}>
                        <IconButton
                            className={classNames({
                                [classes.activeIcon]: align === type,
                                [classes.icon]: align !== type
                            })}
                            icon={icons[type]}
                            onClick={() => onClick(type as AlignTypesType)}
                        />
                    </Tooltip>
                ))}
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(HorizontalAlignSettings);
