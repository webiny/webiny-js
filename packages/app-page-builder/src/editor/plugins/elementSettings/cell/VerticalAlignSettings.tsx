import React, { useMemo } from "react";
import { css } from "emotion";
import classNames from "classnames";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
// Components
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
// Icons
import { ReactComponent as AlignTopIcon } from "../align/icons/align_vertical_top.svg";
import { ReactComponent as AlignCenterIcon } from "../align/icons/align_vertical_center.svg";
import { ReactComponent as AlignBottomIcon } from "../align/icons/align_vertical_bottom.svg";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useElementById } from "~/editor/hooks/useElementById";
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

enum AlignTypesEnum {
    start = "flex-start",
    center = "center",
    end = "flex-end"
}

// Icons map for dynamic render
const icons: Record<string, React.ReactElement> = {
    [AlignTypesEnum.start]: <AlignTopIcon />,
    [AlignTypesEnum.center]: <AlignCenterIcon />,
    [AlignTypesEnum.end]: <AlignBottomIcon />
};
const alignments = Object.keys(icons);

const iconDescriptions: Record<string, string> = {
    [AlignTypesEnum.start]: "Align top",
    [AlignTypesEnum.center]: "Align center",
    [AlignTypesEnum.end]: "Align bottom"
};

const DATA_NAMESPACE = "data.settings.verticalAlign";

const VerticalAlignSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const { displayMode, config } = useDisplayMode();
    const propName = `${DATA_NAMESPACE}.${displayMode}`;
    const [element] = useActiveElement<PbEditorElement>();
    const [parentElement] = useElementById(element?.parent || null);
    const updateElement = useUpdateElement();

    const parentFallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(parentElement, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode, parentElement]
    );
    const parentAlign = get(parentElement, propName, parentFallbackValue || AlignTypesEnum.start);

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode, element]
    );
    const align = get(element, propName, fallbackValue || AlignTypesEnum.start);

    const onClick = (type: AlignTypesEnum) => {
        const newElement = merge({}, element, set({}, propName, type));
        updateElement(newElement);
    };

    return (
        <Accordion
            title={"Vertical align"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${config.displayMode}`}>
                    {config.icon}
                </Tooltip>
            }
        >
            {/* When parent grid's "Column height" property is set to "Match grid height",
                its `data.settings.verticalAlign` property is set to "stretch". */}
            {parentAlign === "stretch" ? (
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
            ) : (
                <Typography use={"body2"}>
                    To align the cell vertically either set the “Column height” property on the Grid
                    element to “Match grid height”, or use the “Vertical Align” settings on the Grid
                    element to align the content vertically.
                </Typography>
            )}
        </Accordion>
    );
};

export default React.memo(VerticalAlignSettings);
