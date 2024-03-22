import React, { useEffect } from "react";
import classSet from "classnames";
import { plugins } from "@webiny/plugins";
import { useEventActionHandler } from "../../hooks/useEventActionHandler";
import { EventActionHandler, PbEditorEventActionPlugin } from "~/types";
import { useKeyHandler } from "../../hooks/useKeyHandler";
import "./Editor.scss";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";
import { useUI } from "~/editor/hooks/useUI";
import { EditorConfig } from "~/editor/config";

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

export const Editor = () => {
    const eventActionHandler = useEventActionHandler();
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const [{ isDragging, isResizing }] = useUI();

    const registeredPlugins = React.useRef<PluginRegistryType>(new Map());

    useEffect(() => {
        addKeyHandler("mod+z", e => {
            e.preventDefault();
            eventActionHandler.undo();
        });
        addKeyHandler("mod+shift+z", e => {
            e.preventDefault();
            eventActionHandler.redo();
        });
        registeredPlugins.current = registerPlugins(eventActionHandler);

        return () => {
            removeKeyHandler("mod+z");
            removeKeyHandler("mod+shift+z");

            unregisterPlugins(eventActionHandler, registeredPlugins.current);
        };
    }, []);

    const classes = {
        "pb-editor": true,
        "pb-editor-dragging": isDragging,
        "pb-editor-resizing": isResizing
    };
    return (
        <div className={classSet(classes)}>
            <EditorConfig.Layout />
            <Dialogs />
            <DragPreview />
        </div>
    );
};
