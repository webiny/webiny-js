import type { useDocumentEditor } from "~/DocumentEditor/index.js";
import { StylesBindingsProcessor } from "@webiny/website-builder-sdk";
import type { IMetadata } from "~/BaseEditor/metadata/index.js";
import {
    BreakpointElementMetadata,
    ElementMetadata,
    NullMetadata,
    StylesMetadata
} from "~/BaseEditor/metadata/index.js";
import { Commands } from "~/BaseEditor/index.js";
import type { Editor } from "~/editorSdk/Editor.js";
import { autorun, makeAutoObservable, runInAction, toJS } from "mobx";
import { type InheritanceInfo, InheritanceProcessor } from "@webiny/website-builder-sdk";
import {
    BindingsProcessor,
    type DocumentElementBindings,
    type Document,
    type TokenReference
} from "@webiny/website-builder-sdk";
import { $getComponentManifestByElementId } from "~/editorSdk/utils/index.js";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { BASE_BREAKPOINT } from "~/constants.js";

export type ElementBreakpointStyles = {
    styles: Record<string, any>;
    /** Which CSS properties are bound to a design token rather than a literal. */
    tokens: Record<string, TokenReference>;
    metadata: IMetadata;
    inheritanceMap: InheritanceInfo["styles"];
};

export class StylesStore {
    private editor: ReturnType<typeof useDocumentEditor>;
    private elementId: string;
    private breakpointNames: string[];
    private stylesProcessor: StylesBindingsProcessor | undefined;
    private elementMetadata: IMetadata = new NullMetadata();
    private devFriendlyStyles: Record<string, any> = {};
    private tokenBindings: Record<string, TokenReference> = {};
    private localPreviewStyles: Record<string, any> | undefined = undefined;
    private currentBreakpoint: string;
    private inheritanceMap: InheritanceInfo["styles"] = {};
    private rawBindings: DocumentElementBindings = {};
    private bindingsProcessor: BindingsProcessor;
    private inheritanceProcessor: InheritanceProcessor;
    constructor(editor: Editor, elementId: string, breakpointNames: string[]) {
        this.editor = editor;
        this.elementId = elementId;
        this.breakpointNames = breakpointNames;

        const manifest = $getComponentManifestByElementId(editor, elementId ?? "");
        const inputsAst = ComponentManifestToAstConverter.convert(manifest?.inputs ?? []);

        this.bindingsProcessor = new BindingsProcessor(breakpointNames);
        this.inheritanceProcessor = new InheritanceProcessor(breakpointNames, inputsAst);

        const document = this.editor.getDocumentState().read();
        const editorState = this.editor.getEditorState().read();
        const breakpoint = editorState.breakpoint ?? BASE_BREAKPOINT;
        this.currentBreakpoint = breakpoint;

        // Initial setup.
        this.calculateStuff(document, breakpoint);

        autorun(() => {
            const document = this.editor.getDocumentState().read();
            const editorState = this.editor.getEditorState().read();
            const breakpoint = editorState.breakpoint ?? BASE_BREAKPOINT;

            runInAction(() => {
                this.currentBreakpoint = breakpoint;
                this.calculateStuff(document, breakpoint);
            });
        });

        makeAutoObservable(this);
    }

    get vm(): ElementBreakpointStyles {
        return {
            styles: this.localPreviewStyles ?? this.devFriendlyStyles,
            tokens: this.tokenBindings,
            metadata: this.elementMetadata,
            inheritanceMap: this.inheritanceMap
        };
    }

    onChange = (cb: (params: { styles: StylesValueObject; metadata: IMetadata }) => void) => {
        if (!this.stylesProcessor) {
            return;
        }

        const styles = new StylesValueObject(this.devFriendlyStyles, { ...this.tokenBindings });
        cb({ styles, metadata: this.elementMetadata });

        const finalStyles = styles.getAll();

        const updatedStyles = this.stylesProcessor.createUpdate(
            finalStyles,
            this.currentBreakpoint,
            styles.getTokens()
        );

        this.editor.updateDocument(document => {
            updatedStyles.applyToDocument(document);
            this.elementMetadata.applyToDocument(document);
        });

        this.localPreviewStyles = undefined;
    };

    onPreviewChange = (
        cb: (params: { styles: StylesValueObject; metadata: IMetadata }) => void
    ) => {
        if (!this.stylesProcessor) {
            return;
        }

        const styles = new StylesValueObject(structuredClone(toJS(this.devFriendlyStyles)), {
            ...this.tokenBindings
        });

        cb({ styles, metadata: this.elementMetadata });

        const finalStyles = styles.getAll();

        this.localPreviewStyles = finalStyles;

        const updatedStyles = this.stylesProcessor.createUpdate(
            finalStyles,
            this.currentBreakpoint,
            styles.getTokens()
        );

        this.editor.executeCommand(Commands.PreviewPatchElement, {
            elementId: this.elementId,
            patch: updatedStyles.createJsonPatch(this.rawBindings)
        });
    };

    private calculateStuff(document: Document, breakpoint: string) {
        const bindings = document.bindings[this.elementId] ?? {};

        this.rawBindings = bindings;
        const resolvedBindings = this.bindingsProcessor.getBindings(bindings, breakpoint);

        const inheritanceMap = this.inheritanceProcessor.getInheritanceMap(bindings, breakpoint);

        this.inheritanceMap = inheritanceMap.styles;

        this.stylesProcessor = new StylesBindingsProcessor(
            this.elementId,
            this.breakpointNames,
            bindings
        );

        this.elementMetadata = new StylesMetadata(
            new BreakpointElementMetadata(
                this.breakpointNames,
                breakpoint,
                new ElementMetadata(this.elementId, bindings.metadata)
            )
        );

        this.devFriendlyStyles = this.stylesProcessor.toDeepStyles(resolvedBindings.styles);
        this.tokenBindings = this.stylesProcessor.toTokenMap(resolvedBindings.styles);
    }
}

export class StylesValueObject {
    private readonly value: Record<string, any>;
    private readonly tokens: Record<string, TokenReference>;

    constructor(value: any = {}, tokens: Record<string, TokenReference> = {}) {
        this.value = value;
        this.tokens = tokens;
    }

    /**
     * Sets a literal. This also clears any token binding on the same property: picking a free
     * colour is how you stop following a token.
     */
    set(key: string, value: any) {
        this.value[key] = value;
        delete this.tokens[key];
    }

    /**
     * Binds a property to a design token. The resolved value is stored too, so the editor preview
     * renders and the reference carries a fallback for when no theme is active.
     */
    setToken(key: string, token: TokenReference, resolvedValue: string) {
        this.value[key] = resolvedValue;
        this.tokens[key] = token;
    }

    getToken(key: string): TokenReference | undefined {
        return this.tokens[key];
    }

    getTokens() {
        return this.tokens;
    }

    get(key: string) {
        return this.value[key];
    }

    getAll() {
        return this.value;
    }

    unset(key: string) {
        delete this.value[key];
        delete this.tokens[key];
    }
}
