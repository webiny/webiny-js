import React, { useEffect } from "react";
import lodashCloneDeep from "lodash/cloneDeep";
import HTML5Backend from "react-dnd-html5-backend";
import classSet from "classnames";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { flattenElementsHelper } from "@webiny/app-page-builder/editor/helpers";
import { EventActionHandler } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PbEditorEventActionPlugin } from "@webiny/app-page-builder/types";
import {
    contentAtom,
    ContentAtomType,
    elementsAtom,
    pageAtom,
    PageAtomType,
    revisionsAtom,
    RevisionsAtomType,
    uiAtom
} from "../../recoil/modules";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { useIsTrackingHistory } from "recoil-undo";
import { DndProvider } from "react-dnd";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { plugins } from "@webiny/plugins";
import "./Editor.scss";
// Components
import EditorBar from "./Bar";
import EditorToolbar from "./Toolbar";
import EditorContent from "./Content";
import DragPreview from "./DragPreview";
import Dialogs from "./Dialogs";

type PluginRegistryType = Map<string, () => void>;

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
        const cb = registered.get(name);
        const pl = plugins.byName<PbEditorEventActionPlugin>(name);
        if (typeof pl.onEditorUnmount === "function") {
            pl.onEditorUnmount(handler, cb);
            continue;
        }
        cb();
    }
};

const triggerActionButtonClick = (name: string): void => {
    const id = `#action-${name}`;
    const element = document.querySelector<HTMLElement | null>(id);
    if (!element) {
        console.warn(`There is no html element "${id}"`);
        return;
    }
    element.click();
};

type EditorPropsType = {
    page: PageAtomType;
    revisions: RevisionsAtomType;
};
export const Editor: React.FunctionComponent<EditorPropsType> = ({ page, revisions }) => {
    const eventActionHandler = useEventActionHandler();
    const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const { isDragging, isResizing, textEditorActive } = useRecoilValue(uiAtom);
    const setPageAtomValue = useSetRecoilState(pageAtom);
    const setElementsAtomValue = useSetRecoilState(elementsAtom);
    const setRevisionsAtomValue = useSetRecoilState(revisionsAtom);
    const [contentAtomValue, setContentAtomValue] = useRecoilState(contentAtom);
    const { getIsTrackingHistory, setIsTrackingHistory } = useIsTrackingHistory();

    const firstRender = React.useRef<boolean>(true);
    const registeredPlugins = React.useRef<PluginRegistryType>();

    if (contentAtomValue && getIsTrackingHistory() === false) {
        setIsTrackingHistory(true);
    }

    useEffect(() => {
        addKeyHandler("mod+z", e => {
            if (textEditorActive) {
                return;
            }
            e.preventDefault();
            triggerActionButtonClick("undo");
        });
        addKeyHandler("mod+shift+z", e => {
            if (textEditorActive) {
                return;
            }
            e.preventDefault();
            triggerActionButtonClick("redo");
        });
        registeredPlugins.current = registerPlugins(eventActionHandler);
        const pageAtomValue = {
            ...page,
            content: undefined
        };
        const content: ContentAtomType = (page as any).content;
        const flattened = flattenElementsHelper(lodashCloneDeep(content));
        setPageAtomValue(pageAtomValue);
        setElementsAtomValue(flattened);
        setRevisionsAtomValue(revisions);
        setContentAtomValue(content);
        return () => {
            removeKeyHandler("mod+z");
            removeKeyHandler("mod+shift+z");

            unregisterPlugins(eventActionHandler, registeredPlugins.current);
        };
    }, []);

    useEffect(() => {
        if (!contentAtomValue || firstRender.current === true) {
            firstRender.current = false;
            return;
        }
        const flattened = flattenElementsHelper(lodashCloneDeep(contentAtomValue));
        setElementsAtomValue(flattened);
    }, [contentAtomValue]);

    const classes = {
        "pb-editor": true,
        "pb-editor-dragging": isDragging,
        "pb-editor-resizing": isResizing
    };
    return (
        <DndProvider backend={HTML5Backend}>
            <div className={classSet(classes)}>
                <EditorBar />
                <EditorToolbar />
                <EditorContent />
                <Dialogs />
                <DragPreview />
            </div>
        </DndProvider>
    );
};
