import type {
    ComponentManifest,
    EditorDocument,
    EditorOptions,
    EditorViewportData,
    PreviewViewportData,
    SerializedComponentGroup
} from "@webiny/website-builder-sdk";
import type { CommandHandler } from "./CommandBus.js";
import { type Command, CommandBus, CommandPriority } from "./CommandBus.js";
import { type StateChangeListener, StateWithHistory } from "./StateWithHistory.js";
import { type MutableState, State } from "./State.js";

export type EditorState = {
    uiReservedSpace: { width: number; height: number };
    boxes: {
        // Coordinates are relative to the preview iframe.
        preview: PreviewViewportData["boxes"];
        // Coordinates are relative to the editor.
        editor: EditorViewportData["boxes"];
    };
    viewport: EditorViewportData["viewport"];
    selectedElement: string | null;
    highlightedElement: string | null;
    components: Record<string, ComponentManifest>;
    componentGroups: Record<string, SerializedComponentGroup>;
    isReadOnly: boolean;
    showOverlays: boolean;
    breakpoint?: string;
    [key: string]: any;
};

export class Editor<TDocument extends EditorDocument = EditorDocument> {
    private readonly documentState: StateWithHistory<TDocument>;
    private readonly editorState: State<EditorState>;
    private readonly commandBus: CommandBus;
    private readonly options: EditorOptions;

    constructor(initialState: TDocument, options?: EditorOptions) {
        this.commandBus = new CommandBus();
        this.documentState = new StateWithHistory(initialState);

        this.options = options || {};

        this.editorState = new State<EditorState>(
            {
                uiReservedSpace: { width: 0, height: 0 },
                isReadOnly: options?.isReadOnly || false,
                showOverlays: true,
                selectedElement: null,
                highlightedElement: null,
                boxes: {
                    preview: {},
                    editor: {}
                },
                viewport: {
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    scrollX: 0,
                    scrollY: 0,
                    scrollWidth: 0,
                    scrollHeight: 0,
                    breakpoint: "desktop",
                    breakpoints: []
                },
                components: {},
                componentGroups: {}
            },
            false
        );
    }

    registerCommandHandler<T>(
        command: Command<T>,
        handler: CommandHandler<T>,
        priority: CommandPriority = CommandPriority.NORMAL
    ) {
        return this.commandBus.register(command, handler, priority);
    }

    executeCommand<T>(command: Command<T>, payload?: T) {
        return this.commandBus.execute(command, payload);
    }

    undo() {
        this.documentState.undo();
    }

    redo() {
        this.documentState.redo();
    }

    updateDocument(cb: (state: MutableState<TDocument>) => void) {
        this.documentState.update(cb);
    }

    updateEditor(cb: (state: MutableState<EditorState>) => void) {
        this.editorState.update(cb);
    }

    public getEditorOptions(): EditorOptions {
        return this.options;
    }

    getEditorState() {
        return this.editorState;
    }

    getDocumentState() {
        return this.documentState;
    }

    onDocumentStateChange(listener: StateChangeListener<TDocument>) {
        return this.documentState.onStateChange(listener);
    }
}
