import React, { useEffect } from "react";
import classSet from "classnames";
import { useEventActionHandler } from "../../hooks/useEventActionHandler";
import { EventActionHandler, PbEditorEventActionPlugin } from "~/types";
import { rootElementAtom, uiAtom } from "../../recoil/modules";
import { useRecoilValue } from "recoil";
import { useKeyHandler } from "../../hooks/useKeyHandler";
import { plugins } from "@webiny/plugins";
import "./Editor.scss";
// Components
import { EditorBar } from "~/editor";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";
import { EditorSidebar } from "./EditorSidebar";

type PluginRegistryType = Map<string, () => void>;

// TODO: replace this with the new <EditorConfig> component
const registerPlugins = (handler: EventActionHandler): PluginRegistryType => {
    const registry = new Map();
    const editorEventActionPlugins = plugins.byType<PbEditorEventActionPlugin>(
        "pb-editor-event-action-plugin"
    );
    for (const pl of editorEventActionPlugins) {
        if (!pl.name) {
            throw new Error(
                `All plugins with type "pb-editor-event-action-plugin" must have a name.`
            );
        }
        registry.set(pl.name, pl.onEditorMount(handler));
    }
    return registry;
};
const unregisterPlugins = (handler: EventActionHandler, registered: PluginRegistryType): void => {
    for (const name of registered.keys()) {
        const cb =
            registered.get(name) ||
            (() => {
                return void 0;
            });
        const pl = plugins.byName<PbEditorEventActionPlugin>(name);
        if (!pl) {
            continue;
        }
        if (typeof pl.onEditorUnmount === "function") {
            pl.onEditorUnmount(handler, cb);
            continue;
        }
        cb();
    }
};

const triggerActionButtonClick = (name: string): void => {
    const id = `#action-${name}`;
    const element = document.querySelector<HTMLElement>(id);
    if (!element) {
        console.warn(`There is no html element "${id}"`);
        return;
    }
    element.click();
};

export const Editor: React.FC = () => {
    const eventActionHandler = useEventActionHandler();
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { isDragging, isResizing } = useRecoilValue(uiAtom);

    const rootElementId = useRecoilValue(rootElementAtom);

    const firstRender = React.useRef<boolean>(true);
    const registeredPlugins = React.useRef<PluginRegistryType>(new Map());

    useEffect(() => {
        addKeyHandler("mod+z", e => {
            e.preventDefault();
            triggerActionButtonClick("undo");
        });
        addKeyHandler("mod+shift+z", e => {
            e.preventDefault();
            triggerActionButtonClick("redo");
        });
        registeredPlugins.current = registerPlugins(eventActionHandler);

        return () => {
            removeKeyHandler("mod+z");
            removeKeyHandler("mod+shift+z");

            unregisterPlugins(eventActionHandler, registeredPlugins.current);
        };
    }, []);

    useEffect(() => {
        if (!rootElementId || firstRender.current === true) {
            firstRender.current = false;
            return;
        }
    }, [rootElementId]);

    const classes = {
        "pb-editor": true,
        "pb-editor-dragging": isDragging,
        "pb-editor-resizing": isResizing
    };
    return (
        <div className={classSet(classes)}>
            <EditorBar />
            <EditorToolbar />
            <EditorContent />
            <EditorSidebar />
            <Dialogs />
            <DragPreview />
        </div>
    );
};
