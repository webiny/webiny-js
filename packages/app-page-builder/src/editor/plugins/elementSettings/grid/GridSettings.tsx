import React, { useMemo } from "react";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { Tooltip } from "@webiny/ui/Tooltip";
import { PbEditorPageElementSettingsRenderComponentProps, PbEditorElement } from "~/types";
import { activeElementAtom, elementWithChildrenByIdSelector } from "~/editor/recoil/modules";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { applyFallbackDisplayMode } from "~/editor/plugins/elementSettings/elementSettingsUtils";

// Components
import Wrapper from "~/editor/plugins/elementSettings/components/Wrapper";
import SelectField from "~/editor/plugins/elementSettings/components/SelectField";
import InputField from "~/editor/plugins/elementSettings/components/InputField";
import {
    ContentWrapper,
    classes
} from "~/editor/plugins/elementSettings/components/StyledComponents";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";

const DATA_NAMESPACE = "data.settings.gridSettings";

export const GridSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const { displayMode, config } = useDisplayMode();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as unknown as PbEditorElement;
    const updateElement = useUpdateElement();
    const flexDirectionPropName = `${DATA_NAMESPACE}.${displayMode}.flexDirection`;
    const verticalAlignPropName = `data.settings.verticalAlign.${displayMode}`;
    const columnGapPropName = `${DATA_NAMESPACE}.${displayMode}.columnGap`;
    const rowGapPropName = `${DATA_NAMESPACE}.${displayMode}.rowGap`;

    const flexDirectionFallbackValue = useMemo(() => {
        const value = applyFallbackDisplayMode(displayMode, mode =>
            get(element, `${DATA_NAMESPACE}.${mode}.flexDirection`)
        );
        // For backward compatibility
        if (!value && (displayMode === "desktop" || displayMode === "tablet")) {
            return "row";
        }
        if (!value && (displayMode === "mobile-landscape" || displayMode === "mobile-portrait")) {
            return "column";
        }

        return value;
    }, [displayMode]);

    const flexDirection = get(element, flexDirectionPropName, flexDirectionFallbackValue || "row");

    const columnWrap = useMemo(() => {
        return flexDirection === "row" ? "row" : "column";
    }, [flexDirection]);

    const onFlexDirectionChange = (type: any) => {
        const newElement = merge({}, element, set({}, flexDirectionPropName, type));
        updateElement(newElement);
    };

    const verticalAlignFallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `data.settings.verticalAlign.${mode}`)
            ),
        [displayMode]
    );

    const columnHeight =
        get(
            element,
            `data.settings.verticalAlign.${displayMode}`,
            verticalAlignFallbackValue || "flex-start"
        ) === "stretch"
            ? "full-height"
            : "auto";

    const onColumnHeightChange = (value: string) => {
        const newElement = merge(
            {},
            element,
            set({}, verticalAlignPropName, value === "auto" ? "flex-start" : "stretch")
        );
        updateElement(newElement);
    };

    const columnGapFallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `data.settings.gridSettings.${mode}.columnGap`)
            ),
        [displayMode]
    );

    const columnGap = get(element, columnGapPropName, columnGapFallbackValue || "");

    const onColumnGapChange = (value: string) => {
        const newElement = merge({}, element, set({}, columnGapPropName, value));
        updateElement(newElement);
    };

    const rowGapFallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `data.settings.gridSettings.${mode}.rowGap`)
            ),
        [displayMode]
    );

    const rowGap = get(element, rowGapPropName, rowGapFallbackValue || "");

    const onRowGapChange = (value: string) => {
        const newElement = merge({}, element, set({}, rowGapPropName, value));
        updateElement(newElement);
    };

    return (
        <Accordion
            title={"Grid Settings"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${config.displayMode}`}>
                    {config.icon}
                </Tooltip>
            }
        >
            <ContentWrapper direction={"column"}>
                <Wrapper
                    label={"Column wrap"}
                    leftCellSpan={5}
                    rightCellSpan={7}
                    containerClassName={classes.simpleGrid}
                >
                    <SelectField
                        disabled={false}
                        value={columnWrap}
                        onChange={value => onFlexDirectionChange(value)}
                    >
                        <option value="row">No wrap</option>
                        <option value="column">Wrap</option>
                    </SelectField>
                </Wrapper>
                <Wrapper
                    label={"Wrap direction"}
                    leftCellSpan={5}
                    rightCellSpan={7}
                    containerClassName={classes.simpleGrid}
                >
                    <SelectField
                        value={flexDirection}
                        onChange={value => onFlexDirectionChange(value)}
                        disabled={flexDirection === "row"}
                    >
                        <option value="column">Regular</option>
                        <option value="column-reverse">Reverse</option>
                    </SelectField>
                </Wrapper>
                <Wrapper
                    label={"Column height"}
                    leftCellSpan={5}
                    rightCellSpan={7}
                    containerClassName={classes.simpleGrid}
                >
                    <SelectField
                        value={columnHeight}
                        onChange={value => onColumnHeightChange(value)}
                    >
                        <option value="auto">Match content size</option>
                        <option value="full-height">Match grid height</option>
                    </SelectField>
                </Wrapper>
                <Wrapper
                    containerClassName={classes.simpleGrid}
                    label={"Column gap"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField placeholder={"px"} value={columnGap} onChange={onColumnGapChange} />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.simpleGrid}
                    label={"Row gap"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                >
                    <InputField placeholder={"px"} value={rowGap} onChange={onRowGapChange} />
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};
