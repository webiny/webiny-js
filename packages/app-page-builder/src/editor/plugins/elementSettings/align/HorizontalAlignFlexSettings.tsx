import React, { useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import {
    PbEditorPageElementPlugin,
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "../../../../types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "../../../recoil/modules";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
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
const DATA_NAMESPACE = "data.settings.horizontalAlignFlex";

const HorizontalAlignFlexSettings: React.FunctionComponent<
    PbEditorPageElementSettingsRenderComponentProps
> = ({ defaultAccordionValue = false }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const propName = `${DATA_NAMESPACE}.${displayMode}`;
    const handler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );
    const align = get(element, propName, fallbackValue || AlignmentsTypeEnum.CENTER);

    const { config: activeEditorModeConfig } = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const updateElement = (element: PbEditorElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element,
                history: true
            })
        );
    };

    const onClick = (type: AlignmentsTypeEnum) => {
        const newElement = merge({}, element, set({}, propName, type));
        updateElement(newElement);
    };

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return (
        <Accordion
            title={"Horizontal align"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeEditorModeConfig.displayMode}`}>
                    {activeEditorModeConfig.icon}
                </Tooltip>
            }
        >
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
