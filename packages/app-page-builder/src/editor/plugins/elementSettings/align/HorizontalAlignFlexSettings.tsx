import React from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import {
    PbEditorPageElementPlugin,
    PbElement,
    PbEditorPageElementSettingsRenderComponentProps
} from "@webiny/app-page-builder/types";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
// Icons
import { ReactComponent as AlignLeftIcon } from "./icons/align_horizontal_left.svg";
import { ReactComponent as AlignCenterIcon } from "./icons/align_horizontal_center.svg";
import { ReactComponent as AlignRightIcon } from "./icons/align_horizontal_right.svg";

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
    "flex-start": <AlignLeftIcon />,
    center: <AlignCenterIcon />,
    "flex-end": <AlignRightIcon />
};

const iconDescriptions = {
    "flex-start": "Align left",
    center: "Align center",
    "flex-end": "Align right"
};
enum AlignmentsTypeEnum {
    FLEX_START = "flex-start",
    CENTER = "center",
    FLEX_END = "flex-end"
}

const alignments = Object.keys(icons);

const HorizontalAlignFlexSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue = false
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const align = get(element, "data.settings.horizontalAlignFlex", AlignmentsTypeEnum.CENTER);

    const updateElement = (element: PbElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element
            })
        );
    };

    const onClick = (type: AlignmentsTypeEnum) => {
        updateElement({
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...element.data.settings,
                    horizontalAlignFlex: type
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
        <Accordion title={"Horizontal align"} defaultValue={defaultAccordionValue}>
            <ContentWrapper>
                {alignments.map(type => (
                    <Tooltip key={type} content={iconDescriptions[type]} placement={"top"}>
                        <IconButton
                            className={classNames({
                                [classes.activeIcon]: align === type,
                                [classes.icon]: align !== type
                            })}
                            icon={icons[type]}
                            onClick={() => onClick(type as AlignmentsTypeEnum)}
                        />
                    </Tooltip>
                ))}
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(HorizontalAlignFlexSettings);
