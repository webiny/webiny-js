import styled from "@emotion/styled";
import { createElementHelper } from "@webiny/app-page-builder/editor/helpers";
import React from "react";
import {
    calculatePresetPluginCells,
    getPresetPlugins
} from "@webiny/app-page-builder/editor/plugins/gridPresets";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { PbEditorGridPresetPluginType, PbElement } from "@webiny/app-page-builder/types";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { useRecoilValue } from "recoil";

const StyledIconButton = styled("button")(({ active }: any) => ({
    padding: "0",
    margin: "0 2px 2px 0",
    background: "transparent",
    width: "auto",
    height: "auto",
    border: "0 none",
    cursor: "pointer",
    opacity: active ? 1 : 0.7,
    ":hover": {
        opacity: 1
    },
    ":focus": {
        outline: "none"
    }
}));

const createCells = (amount: number) => {
    return Array(amount)
        .fill(0)
        .map(() => createElementHelper("cell", {}));
};

const resizeCells = (elements: PbElement[], cells: number[]): PbElement[] => {
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

const updateChildrenWithPreset = (target: PbElement, pl: PbEditorGridPresetPluginType) => {
    const cells = calculatePresetPluginCells(pl);
    const total = target.elements.length;
    const max = cells.length;
    if (total === max) {
        return resizeCells(target.elements, cells);
    } else if (total > max) {
        return resizeCells(target.elements.slice(0, max), cells);
    }
    const created = target.elements.concat(createCells(max - total));
    return resizeCells(created, cells);
};

export const Settings: React.FunctionComponent = () => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const currentType = element.data.settings.grid?.cellsType;

    const presetPlugins = getPresetPlugins();

    const setPreset = (pl: PbEditorGridPresetPluginType) => {
        const type = pl.cellsType;
        if (type === currentType) {
            return;
        }
        const newElement = {
            ...element,
            data: {
                ...element.data,
                settings: {
                    ...(element.data.settings || {}),
                    grid: {
                        type
                    }
                }
            },
            elements: updateChildrenWithPreset(element, pl)
        };
        handler.trigger(
            new UpdateElementActionEvent({
                element: newElement
            })
        );
    };
    return (
        <Tabs>
            <Tab label={"Grid"}>
                {presetPlugins.map(pl => {
                    const Icon = pl.icon;
                    return (
                        <StyledIconButton
                            key={`preset-${pl.cellsType}`}
                            onClick={() => setPreset(pl)}
                            active={pl.cellsType === currentType}
                        >
                            <Icon />
                        </StyledIconButton>
                    );
                })}
            </Tab>
        </Tabs>
    );
};
