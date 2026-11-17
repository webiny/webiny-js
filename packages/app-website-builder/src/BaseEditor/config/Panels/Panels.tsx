import React from "react";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { useEditorConfig } from "../EditorConfig.js";
import { Panel } from "./Panel.js";
import { PanelsContext } from "./PanelsContext.js";
import { PanelSlot } from "./PanelSlot.js";
import { PanelHeader } from "./PanelHeader.js";
import type { PanelConfig } from "./types.js";
import type { PanelSide } from "./types.js";

/**
 * Which panels are open, by name. Kept per browser, so the editor opens the way it was left. One key
 * per side: each side's state is its own, and one side writing the other's would undo its changes.
 */
const storageKey = (side: PanelSide) => {
    return side === "right" ? "wb-editor/panels" : `wb-editor/panels/${side}`;
};

type OpenState = Record<string, boolean>;

const readStored = (side: PanelSide): OpenState => {
    try {
        const key = storageKey(side);
        const raw = window.localStorage.getItem(key);
        const parsed: unknown = raw ? JSON.parse(raw) : {};
        const state: OpenState = {};
        if (typeof parsed === "object" && parsed !== null) {
            for (const [name, open] of Object.entries(parsed)) {
                if (typeof open === "boolean") {
                    state[name] = open;
                }
            }
        }
        return state;
    } catch {
        // Unreadable: start from each panel's default.
    }
    return {};
};

const store = (side: PanelSide, state: OpenState): void => {
    try {
        const serialized = JSON.stringify(state);
        const key = storageKey(side);
        window.localStorage.setItem(key, serialized);
    } catch {
        // Private mode or a full quota: the panels still work, they just won't be remembered.
    }
};

export interface PanelsProps {
    /** Default `"right"`. */
    side?: PanelSide;
}

const BasePanels = makeDecoratable("EditorPanels", ({ side = "right" }: PanelsProps) => {
    const config = useEditorConfig();
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const [stored, setStored] = useState<OpenState>(() => readStored(side));
    // Which panel's toggle was pressed, and how many times: each press moves focus once.
    const [toggled, setToggled] = useState<{ name: string; count: number } | null>(null);

    const panels = useMemo(() => {
        // Absent until a panel is registered.
        const all: PanelConfig[] = config.panels ?? [];
        const shown = all.filter(panel => {
            const panelSide = panel.side ?? "right";
            return panelSide === side && (panel.showInReadOnly || !isReadOnly);
        });
        // The first one registered sits nearest the canvas.
        return side === "left" ? shown.reverse() : shown;
    }, [config.panels, isReadOnly, side]);

    const isOpen = useCallback(
        (name: string) => {
            if (name in stored) {
                return stored[name];
            }
            const panel = panels.find(panel => panel.name === name);
            return panel?.defaultOpen ?? false;
        },
        [stored, panels]
    );

    const setOpen = useCallback(
        (name: string, open: boolean) => {
            setToggled(current => ({ name, count: (current?.count ?? 0) + 1 }));
            setStored(current => {
                const next = { ...current, [name]: open };
                store(side, next);
                return next;
            });
        },
        [side]
    );

    const context = useMemo(() => ({ isOpen, setOpen }), [isOpen, setOpen]);

    return (
        <PanelsContext.Provider value={context}>
            {/* Not `h-full`: the row stretches it, which is what lets the panels fill the height. */}
            <div className={"flex flex-none"}>
                {panels.map(panel => (
                    <PanelSlot
                        key={panel.name}
                        panel={panel}
                        side={side}
                        open={isOpen(panel.name)}
                        toggleCount={toggled?.name === panel.name ? toggled.count : 0}
                        onExpand={() => setOpen(panel.name, true)}
                    />
                ))}
            </div>
        </PanelsContext.Provider>
    );
});

export const Panels = Object.assign(BasePanels, { Panel, Header: PanelHeader });
