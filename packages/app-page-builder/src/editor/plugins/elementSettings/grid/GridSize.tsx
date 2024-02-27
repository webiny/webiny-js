import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { Cell, Grid } from "@webiny/ui/Grid";
import {
    DisplayMode,
    PbEditorElement,
    PbEditorGridPresetPluginType,
    PbEditorPageElementSettingsRenderComponentProps
} from "../../../../types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { createElement } from "../../../helpers";
import { calculatePresetPluginCells, getPresetPlugins } from "../../../plugins/gridPresets";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";

// Components
import CounterInput from "./CounterInput";
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    icon: css({
        "& .mdc-deprecated-list-item__graphic > svg": {
            width: "18px",
            height: "18px"
        }
    })
};

const StyledIconButton = styled("button")(({ active }: any) => ({
    padding: "0",
    margin: "0 2px 2px 0",
    background: "transparent",
    width: "auto",
    height: "auto",
    border: "0 none",
    cursor: "pointer",
    opacity: active ? 1 : 0.7,
    "& svg": {
        filter: active ? "none" : "grayscale(1)"
    },
    ":hover": {
        "& svg": {
            boxShadow: active ? "none" : "0 0 5px rgba(0, 204, 176, 1)"
        }
    },
    ":focus": {
        outline: "none"
    }
}));

const createCells = (amount: number): PbEditorElement[] => {
    return Array(amount)
        .fill(0)
        .map(() => createElement("cell", {}));
};

const resizeCells = (elements: PbEditorElement[], cells: number[]): PbEditorElement[] => {
    return elements.map((element, index) => {
        return {
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...element.data.settings,
                    grid: {
                        size: cells[index]
                    }
                }
            }
        };
    });
};

const updateChildrenWithPreset = (
    target: PbEditorElement,
    pl: PbEditorGridPresetPluginType,
    rowCount?: number
): PbEditorElement[] => {
    const cells = [...Array(rowCount || 1)].map(() => calculatePresetPluginCells(pl)).flat();
    const total = target.elements.length;
    const max = cells.length;
    if (total === max) {
        return resizeCells(target.elements as PbEditorElement[], cells);
    } else if (total > max) {
        return resizeCells(target.elements.slice(0, max) as PbEditorElement[], cells);
    }
    const created = [...(target.elements as PbEditorElement[]), ...createCells(max - total)];
    return resizeCells(created, cells);
};

const updateCells = (
    target: PbEditorElement,
    rowCount: number,
    columns: number
): PbEditorElement[] => {
    const cells = [...Array(rowCount || 1)]
        .map(() => {
            return [...Array(columns || 1)].map((_, index) =>
                get(target.elements?.[index] || {}, "data.settings.grid.size", 1)
            );
        })
        .flat();
    const total = target.elements.length;
    const max = cells.length;
    if (total < max) {
        const created = [...(target.elements as PbEditorElement[]), ...createCells(max - total)];
        return resizeCells(created, cells);
    } else if (total > max) {
        return resizeCells(target.elements.slice(0, max) as PbEditorElement[], cells);
    }
    return target.elements as PbEditorElement[];
};

export const GridSize = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const handler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as unknown as PbEditorElement;
    const currentCellsType = element.data.settings?.grid?.cellsType;
    const currentRowCount = element.data.settings?.grid?.rowCount || 1;
    const columnsCount = element.data?.settings?.grid?.cellsType?.split("-")?.length || 1;
    const presetPlugins = getPresetPlugins();

    const onInputSizeChange = (value: number, index: number) => {
        const columnSizes = element.elements?.slice(0, columnsCount)?.map((cell, cellIndex) => {
            if (cellIndex === index) {
                return value;
            }
            return (cell as PbEditorElement)?.data?.settings?.grid?.size || 1;
        });
        const newElement = merge(
            {},
            element,
            set({}, "data.settings.grid.columnSizes", columnSizes)
        );
        const cellsToUpdate = [...Array(currentRowCount)].map(
            (_, rowIndex) => index + columnsCount * rowIndex
        );
        const updatedCells = element.elements.map((cell, cellIndex) => {
            if (cellsToUpdate.includes(cellIndex)) {
                return merge({}, cell, set({}, "data.settings.grid.size", value));
            }
            return cell;
        });

        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...newElement,
                    elements: updatedCells
                },
                history: true
            })
        );
    };

    const setPreset = (pl: PbEditorGridPresetPluginType) => {
        const cellsType = pl.cellsType;
        if (cellsType === currentCellsType) {
            return;
        }
        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...(element.data.settings || {}),
                            grid: {
                                ...(element.data.settings?.grid || {}),
                                columnSizes: undefined,
                                cellsType
                            }
                        }
                    },
                    elements: updateChildrenWithPreset(element, pl, currentRowCount)
                },
                history: true
            })
        );
    };
    const totalCellsUsed = element.elements.slice(0, columnsCount).reduce((total, cell) => {
        return total + ((cell as PbEditorElement).data.settings?.grid?.size || 1);
    }, 0);

    const onRowsChange = (rowCount: number) => {
        const newElement = merge(
            {},
            element,
            set({}, "data.settings.grid.rowCount", rowCount),
            set({}, `data.settings.gridSettings.${DisplayMode.DESKTOP}.flexDirection`, "column"),
            set({}, `data.settings.gridSettings.${DisplayMode.TABLET}.flexDirection`, "column"),
            set({}, `data.settings.verticalAlign.${DisplayMode.DESKTOP}`, "stretch"),
            set({}, `data.settings.verticalAlign.${DisplayMode.TABLET}`, "stretch"),
            set({}, `data.settings.verticalAlign.${DisplayMode.MOBILE_LANDSCAPE}`, "flex-start"),
            set({}, `data.settings.verticalAlign.${DisplayMode.MOBILE_PORTRAIT}`, "flex-start")
        );
        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...newElement,
                    elements: updateCells(newElement, rowCount, columnsCount)
                },
                history: true
            })
        );
    };

    return (
        <Accordion title={"Grid Size"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Grid className={classes.grid}>
                    {presetPlugins.map(pl => {
                        const Icon = pl.icon;
                        return (
                            <Cell key={`preset-${pl.cellsType}`} span={4}>
                                <StyledIconButton
                                    onClick={() => setPreset(pl)}
                                    active={pl.cellsType === currentCellsType}
                                >
                                    <Icon />
                                </StyledIconButton>
                            </Cell>
                        );
                    })}
                </Grid>

                <Grid className={classes.grid}>
                    <Cell span={12}>
                        <CounterInput
                            value={element.data.settings?.grid?.rowCount || 1}
                            label={"Row count"}
                            minErrorMessage={"Grid can't have less rows than this."}
                            maxErrorMessage={"Grid can't have more rows than this."}
                            onChange={value => {
                                onRowsChange(value);
                            }}
                            maxAllowed={12}
                        />
                    </Cell>
                </Grid>

                <Grid className={classes.grid}>
                    {[...Array(columnsCount)].map((_, index) => {
                        const size =
                            (element.elements?.[index] as PbEditorElement)?.data?.settings?.grid
                                ?.size || 1;
                        return (
                            <Cell span={12} key={`column-size-${index}`}>
                                <CounterInput
                                    value={size}
                                    label={`Column ${index + 1}`}
                                    minErrorMessage={"Column can't get smaller than this."}
                                    maxErrorMessage={"Column can't get bigger than this."}
                                    onChange={value => onInputSizeChange(value, index)}
                                    maxAllowed={12 - totalCellsUsed}
                                />
                            </Cell>
                        );
                    })}
                </Grid>
            </ContentWrapper>
        </Accordion>
    );
};
