import React from "react";
import {
    calculatePresetPluginCells,
    getPresetPlugins
} from "@webiny/app-page-builder/editor/plugins/gridPresets";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { createElement } from "@webiny/app-page-builder/editor/utils";
import { PbEditorGridPresetPluginType, PbElement } from "@webiny/app-page-builder/types";
import {
    activeElementIdSelector,
    elementWithChildrenByIdSelector
} from "@webiny/app-page-builder/editor/recoil/modules";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { useRecoilValue } from "recoil";

const createCells = (amount: number) => {
    return Array(amount)
        .fill(0)
        .map(() => createElement("cell", {}));
};

const resizeCells = (elements: PbElement[], cells: number[]): PbElement[] => {
    return elements.map((element, index) => {
        return {
            ...element,
            data: {
                ...(element.data || {}),
                settings: {
                    ...(element.data?.settings || {}),
                    size: cells[index]
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
    return resizeCells(target.elements.concat(createCells(max - total)), cells);
};

export const Settings: React.FunctionComponent = () => {
    const handler = useEventActionHandler();
    const id = useRecoilValue(activeElementIdSelector);
    const element = useRecoilValue(elementWithChildrenByIdSelector(id));

    const presetPlugins = getPresetPlugins();

    const setPreset = (pl: PbEditorGridPresetPluginType) => {
        const type = pl.cells;
        if (type === element.data.settings?.grid?.type) {
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
                    const name = pl.cells.replace(/\-/g, " + ");
                    return (
                        <button key={`preset-${pl.cells}`} onClick={() => setPreset(pl)}>
                            {name}
                        </button>
                    );
                })}

                {/*<CellWidthSlider elements={element.elements} onDragEnd={(cells: number[]) => setPreset(...cells)} />*/}
            </Tab>
        </Tabs>
    );
};
