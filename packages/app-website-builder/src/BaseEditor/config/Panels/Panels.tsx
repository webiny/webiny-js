import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useEditorConfig } from "../EditorConfig.js";
import type { ElementConfig } from "../Element.js";
import { createGetId } from "../createGetId.js";
import { Rail } from "./Rail.js";

const SCOPE = "panels";

/** Which panels are open, by name. Kept per browser, so the editor opens the way it was left. */
const STORAGE_KEY = "wb-editor/panels";

type OpenState = Record<string, boolean>;

const readStored = (): OpenState => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : {};
        return typeof parsed === "object" && parsed !== null ? (parsed as OpenState) : {};
    } catch {
        return {};
    }
};

const store = (state: OpenState): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Private mode or a full quota: the panels still work, they just won't be remembered.
    }
};

interface PanelsContextValue {
    isOpen(name: string): boolean;
    setOpen(name: string, open: boolean): void;
}

const PanelsContext = createContext<PanelsContextValue | null>(null);

/**
 * The open state of one panel, for the content inside it: the AI panel closes its rail when its own
 * close button is pressed, for example.
 */
export const usePanel = (name: string) => {
    const context = useContext(PanelsContext);
    if (!context) {
        throw new Error("usePanel() must be used inside the editor's panels.");
    }

    return {
        isOpen: context.isOpen(name),
        open: () => context.setOpen(name, true),
        close: () => context.setOpen(name, false),
        toggle: () => context.setOpen(name, !context.isOpen(name))
    };
};

const getElementId = createGetId(SCOPE)();

export interface PanelProps {
    name: string;
    /** Written down the rail. Short: one or two words. */
    label?: string;
    icon?: React.JSX.Element;
    /** The panel itself. It sizes itself and sets `data-affects-preview="width"`. */
    element?: React.JSX.Element;
    /** Whether the panel is open the first time the editor is used. */
    defaultOpen?: boolean;
    remove?: boolean;
    before?: string;
    after?: string;
}

/**
 * A panel on the right of the editor, opened and closed from the rail at the edge. Open panels sit
 * side by side, in the order they are registered, the first one nearest the canvas.
 */
const Panel = makeDecoratable("EditorPanel", (props: PanelProps) => {
    const getId = useIdGenerator("element");
    const id = getId(getElementId(props.name));
    const before = props.before ? getId(getElementId(props.before)) : undefined;
    const after = props.after ? getId(getElementId(props.after)) : undefined;

    return (
        <Property
            id={id}
            name={"elements"}
            remove={props.remove}
            array={true}
            before={before}
            after={after}
        >
            <Property id={`${id}:name`} name={"name"} value={props.name} />
            <Property id={`${id}:scope`} name={"scope"} value={SCOPE} />
            <Property id={`${id}:group`} name={"group"} value={SCOPE} />
            {props.element ? (
                <Property id={`${id}:element`} name={"element"} value={props.element} />
            ) : null}
            {props.label ? (
                <Property id={`${id}:label`} name={"label"} value={props.label} />
            ) : null}
            {props.icon ? <Property id={`${id}:icon`} name={"icon"} value={props.icon} /> : null}
            {props.defaultOpen !== undefined ? (
                <Property id={`${id}:defaultOpen`} name={"defaultOpen"} value={props.defaultOpen} />
            ) : null}
        </Property>
    );
});

const BasePanels = makeDecoratable("EditorPanels", () => {
    const { elements } = useEditorConfig();
    const [stored, setStored] = useState<OpenState>(readStored);

    const panels = useMemo(() => {
        return elements.filter((element: ElementConfig) => element.scope === SCOPE);
    }, [elements]);

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

    return (
        <PanelsContext.Provider value={context}>
            {/* Not `h-full`: the row stretches it, which is what lets the panels fill the height. */}
            <div className={"flex flex-none"}>
                {panels.map(panel =>
                    isOpen(panel.name) ? (
                        <wb-editor-ui-element
                            key={panel.name}
                            data-name={panel.name}
                            class={"contents"}
                        >
                            {panel.element}
                        </wb-editor-ui-element>
                    ) : null
                )}
                <Rail
                    panels={panels.map(panel => ({
                        name: panel.name,
                        label: panel.label ?? panel.name,
                        icon: panel.icon,
                        open: isOpen(panel.name)
                    }))}
                    onToggle={name => setOpen(name, !isOpen(name))}
                />
            </div>
        </PanelsContext.Provider>
    );
});

export const Panels = Object.assign(BasePanels, { Panel });
