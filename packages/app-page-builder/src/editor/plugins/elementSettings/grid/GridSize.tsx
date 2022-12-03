import React from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { useRecoilValue } from "recoil";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    PbEditorGridPresetPluginType,
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorElement
} from "../../../../types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { createElement } from "../../../helpers";
import { calculatePresetPluginCells, getPresetPlugins } from "../../../plugins/gridPresets";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";
// Components
import CellSize from "./CellSize";
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
        "& .mdc-list-item__graphic > svg": {
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
    pl: PbEditorGridPresetPluginType
): PbEditorElement[] => {
    const cells = calculatePresetPluginCells(pl);
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

export const GridSize: React.FC<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const handler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as unknown as PbEditorElement;
    const currentCellsType = element.data.settings?.grid?.cellsType;
    const presetPlugins = getPresetPlugins();

    const onInputSizeChange = (value: number, index: number) => {
        const cellElement = element.elements[index] as PbEditorElement;
        if (!cellElement) {
            throw new Error(`There is no element on index ${index}.`);
        }
        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...cellElement,
                    data: {
                        ...cellElement.data,
                        settings: {
                            ...(cellElement.data.settings || {}),
                            grid: {
                                size: value
                            }
                        }
                    }
                } as any,
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
                                cellsType
                            }
                        }
                    },
                    elements: updateChildrenWithPreset(element, pl) as any
                },
                history: true
            })
        );
    };
    const totalCellsUsed = element.elements.reduce((total, cell) => {
        return total + ((cell as PbEditorElement).data.settings?.grid?.size || 1);
    }, 0);

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
                    {element.elements.map((cell, index) => {
                        const size = (cell as PbEditorElement).data.settings?.grid?.size || 1;
                        return (
                            <Cell span={12} key={`cell-size-${index}`}>
                                <CellSize
                                    value={size}
                                    label={`Cell ${index + 1}`}
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
