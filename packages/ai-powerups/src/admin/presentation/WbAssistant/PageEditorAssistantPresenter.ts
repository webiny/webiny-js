import { AssistantClientTools } from "@webiny/app-admin";
import { AssistantPageContext } from "@webiny/app-admin";
import { ToolPipelineRunner } from "@webiny/app-admin";
import { ToolRegistry } from "@webiny/app-admin";
import { PageEditorAssistantPresenter as Abstraction } from "./abstractions.js";
import { createPageEditorAccess } from "./createPageEditorAccess.js";
import { createPageEditorTools } from "./pageEditorTools.js";
import { describePage } from "./describePage.js";
import type { PageEditor } from "./types.js";

interface Connection {
    editor: PageEditor;
    context: AssistantPageContext.Owner;
    tools: AssistantClientTools.Owner | null;
    unsubscribe: () => void;
}

class PageEditorAssistantPresenterImpl implements Abstraction.Interface {
    private connection: Connection | null = null;

    constructor(
        private clientTools: AssistantClientTools.Interface,
        private pageContext: AssistantPageContext.Interface,
        private pipelineRunner: ToolPipelineRunner.Interface,
        private toolRegistry: ToolRegistry.Interface
    ) {}

    attach(editor: PageEditor): void {
        this.detach();

        const page = describePage(editor);
        const context = this.pageContext.set(page);
        // The outline follows the page as it changes, by hand or by the assistant.
        const unsubscribe = editor.onDocumentStateChange(() => this.refresh());

        // A read-only editor shows a page that can't change, so it offers no tools to change it.
        let tools: AssistantClientTools.Owner | null = null;
        const { isReadOnly } = editor.getEditorState().read();
        if (!isReadOnly) {
            const access = createPageEditorAccess(editor, this.pipelineRunner, this.toolRegistry);
            const editorTools = createPageEditorTools(access);
            tools = this.clientTools.register(editorTools);
        }

        this.connection = { editor, context, tools, unsubscribe };
    }

    refresh(): void {
        if (!this.connection) {
            return;
        }
        const page = describePage(this.connection.editor);
        this.pageContext.update(this.connection.context, page);
    }

    detach(): void {
        if (!this.connection) {
            return;
        }
        const { context, tools, unsubscribe } = this.connection;
        unsubscribe();
        this.pageContext.clear(context);
        if (tools) {
            this.clientTools.unregister(tools);
        }
        this.connection = null;
    }
}

export const PageEditorAssistantPresenterImplementation = Abstraction.createImplementation({
    implementation: PageEditorAssistantPresenterImpl,
    dependencies: [AssistantClientTools, AssistantPageContext, ToolPipelineRunner, ToolRegistry]
});
