import React from "react";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { useEditorConfig } from "../EditorConfig.js";
import { Panel } from "./Panel.js";
import { PanelsContext } from "./PanelsContext.js";
import { Rail } from "./Rail.js";
import type { PanelConfig } from "./types.js";

/** Which panels are open, by name. Kept per browser, so the editor opens the way it was left. */
const STORAGE_KEY = "wb-editor/panels";

type OpenState = Record<string, boolean>;

const readStored = (): OpenState => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
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

const store = (state: OpenState): void => {
    try {
        const serialized = JSON.stringify(state);
        window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
        // Private mode or a full quota: the panels still work, they just won't be remembered.
    }
};

const BasePanels = makeDecoratable("EditorPanels", () => {
    const config = useEditorConfig();
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);
    const [stored, setStored] = useState<OpenState>(readStored);

    const panels = useMemo(() => {
        // Absent until a panel is registered.
        const all: PanelConfig[] = config.panels ?? [];
        return all.filter(panel => panel.showInReadOnly || !isReadOnly);
    }, [config.panels, isReadOnly]);

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

    const setOpen = useCallback((name: string, open: boolean) => {
        setStored(current => {
            const next = { ...current, [name]: open };
            store(next);
            return next;
        });
    }, []);

    const context = useMemo(() => ({ isOpen, setOpen }), [isOpen, setOpen]);
    const openPanels = panels.filter(panel => isOpen(panel.name));
    const tabs = panels.map(panel => ({
        name: panel.name,
        label: panel.label,
        icon: panel.icon,
        open: isOpen(panel.name)
    }));
    const toggle = (name: string) => {
        const open = isOpen(name);
        setOpen(name, !open);
    };

    return (
        <PanelsContext.Provider value={context}>
            {/* Not `h-full`: the row stretches it, which is what lets the panels fill the height. */}
            <div className={"flex flex-none"}>
                {openPanels.map(panel => (
                    <wb-editor-ui-element
                        key={panel.name}
                        data-name={panel.name}
                        class={"contents"}
                    >
                        {panel.element}
                    </wb-editor-ui-element>
                ))}
                <Rail panels={tabs} onToggle={toggle} />
            </div>
        </PanelsContext.Provider>
    );
});

export const Panels = Object.assign(BasePanels, { Panel });
