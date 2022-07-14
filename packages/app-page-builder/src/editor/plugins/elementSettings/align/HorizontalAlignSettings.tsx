import React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
import { ReactComponent as AlignTextLeftIcon } from "./icons/format_align_left.svg";
import { ReactComponent as AlignTextCenterIcon } from "./icons/format_align_center.svg";
import { ReactComponent as AlignTextRightIcon } from "./icons/format_align_right.svg";
import { ReactComponent as AlignTextJustifyIcon } from "./icons/format_align_justify.svg";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";

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

// Icons map for dynamic render
const icons: Record<string, React.ReactElement> = {
    left: <AlignTextLeftIcon />,
    center: <AlignTextCenterIcon />,
    right: <AlignTextRightIcon />,
    justify: <AlignTextJustifyIcon />
};

const iconDescriptions: Record<string, string> = {
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
const HorizontalAlignSettings: React.FC<
    HorizontalAlignActionPropsType & PbEditorPageElementSettingsRenderComponentProps
> = ({ options: { alignments = DEFAULT_ALIGNMENTS }, defaultAccordionValue }) => {
    const [element] = useActiveElement<PbEditorElement>();
    const updateElement = useUpdateElement();

    const align = getAlignValue(element, defaultAlignValue);

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
