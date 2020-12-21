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
import { ReactComponent as AlignTopIcon } from "./icons/align_vertical_top.svg";
import { ReactComponent as AlignCenterIcon } from "./icons/align_vertical_center.svg";
import { ReactComponent as AlignBottomIcon } from "./icons/align_vertical_bottom.svg";

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
const iconDescriptions = {
    start: "Align top",
    center: "Align center",
    end: "Align bottom"
};

const VerticalAlignSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const align = get(element, "data.settings.verticalAlign", AlignTypesEnum.CENTER);

    const updateElement = (element: PbElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element,
                history: true
            })
        );
    };

    const onClick = (type: AlignTypesEnum) => {
        updateElement({
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...element.data.settings,
                    verticalAlign: type
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
        <Accordion title={"Vertical align"} defaultValue={defaultAccordionValue}>
            <ContentWrapper>
                {alignments.map(type => (
                    <Tooltip key={type} content={iconDescriptions[type]} placement={"top"}>
                        <IconButton
                            className={classNames({
                                [classes.activeIcon]: align === type,
                                [classes.icon]: align !== type
                            })}
                            icon={icons[type]}
                            onClick={() => onClick(type as AlignTypesEnum)}
                        />
                    </Tooltip>
                ))}
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(VerticalAlignSettings);
