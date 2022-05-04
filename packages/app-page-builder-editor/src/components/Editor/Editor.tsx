import React, { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import classSet from "classnames";
// import { useKeyHandler } from "~/hooks/useKeyHandler";
import "./Editor.scss";
// Components
// import EditorBar from "./Bar";
// import EditorToolbar from "./Toolbar";
// import EditorContent from "./Content";
// import DragPreview from "./DragPreview";
// import Dialogs from "./Dialogs";
// import ElementSideBar from "./ElementSideBar";
import { PageAtomType, RevisionsAtomType } from "~/state";
import { usePbEditor } from "~/hooks/usePbEditor";
import { useUI } from "~/hooks/useUI";
// import { useRevisions } from "~/hooks/useRevisions";
// import { UndoStateChangeActionEvent } from "~/actions/undo";
// import { RedoStateChangeActionEvent } from "~/actions/redo";
// import { EditorPreviewContent } from "./EditorPreviewContent";

type EditorPropsType = {
    page: PageAtomType;
    revisions: RevisionsAtomType;
};

export const Editor: React.FunctionComponent<EditorPropsType> = (/*{ revisions }*/) => {
    const { editor } = usePbEditor();
    // const { addKeyHandler, removeKeyHandler } = useKeyHandler();
    const [{ isDragging, isResizing }] = useUI();

    // const [, setRevisions] = useRevisions();
    const rootElementId = editor.getRootElementId();

    const firstRender = React.useRef<boolean>(true);

    useEffect(() => {
        // @ts-ignore
        window["editor"] = editor;
        // addKeyHandler("mod+z", e => {
        //     e.preventDefault();
        //     // app.dispatchEvent(new UndoStateChangeActionEvent());
        // });
        // addKeyHandler("mod+shift+z", e => {
        //     e.preventDefault();
        //     // app.dispatchEvent(new RedoStateChangeActionEvent());
        // });
        //
        // setRevisions(revisions);
        //
        //
        // return () => {
        //     removeKeyHandler("mod+z");
        //     removeKeyHandler("mod+shift+z");
        // };
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
        <DndProvider backend={HTML5Backend}>
            <div className={classSet(classes)}>
                <pre>{JSON.stringify(editor.getPage(), null, 4)}</pre>
                {/*<EditorBar />*/}
                {/*<EditorToolbar />*/}
                {/*<EditorContent />*/}
                {/*<EditorPreviewContent />*/}
                {/*<ElementSideBar />*/}
                {/*<Dialogs />*/}
                {/*<DragPreview />*/}
            </div>
        </DndProvider>
    );
};
