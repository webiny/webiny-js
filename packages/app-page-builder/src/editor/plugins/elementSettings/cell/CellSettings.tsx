import React, { useMemo } from "react";
import { css } from "emotion";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { Switch } from "@webiny/ui/Switch";
import { Tooltip } from "@webiny/ui/Tooltip";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
// Components
import Accordion from "../components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            margin: "0px 0px 16px"
        }
    }),
    rightCellStyle: css({
        justifySelf: "end",
        alignSelf: "center"
    }),
    leftCellStyle: css({
        alignSelf: "center"
    })
};

const DATA_NAMESPACE = "data.settings.cellSettings";

const CellSettings: React.FC<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const { displayMode, config } = useDisplayMode();
    const propName = `${DATA_NAMESPACE}.${displayMode}.absolutePositioning`;
    const [element] = useActiveElement<PbEditorElement>();
    const updateElement = useUpdateElement();

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}.absolutePositioning`)
            ),
        [element, displayMode]
    );

    const absolutePositioning = get(element, propName, fallbackValue || false);

    const onClick = (value: boolean) => {
        const newElement = merge({}, element, set({}, propName, value));
        updateElement(newElement);
    };

    return (
        <Accordion
            title={"Cell Settings"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${config.displayMode}`}>
                    {config.icon}
                </Tooltip>
            }
        >
            <Wrapper
                containerClassName={classes.grid}
                label={"Absolute positioning"}
                leftCellSpan={8}
                rightCellSpan={4}
                leftCellClassName={classes.leftCellStyle}
                rightCellClassName={classes.rightCellStyle}
            >
                <Switch value={absolutePositioning} onChange={onClick} />
            </Wrapper>
        </Accordion>
    );
};

export default React.memo(CellSettings);
