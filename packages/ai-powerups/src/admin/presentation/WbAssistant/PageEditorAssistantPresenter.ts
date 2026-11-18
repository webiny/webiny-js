import { AdminAssistantPresenter } from "@webiny/app-admin";
import { AssistantClientTools } from "@webiny/app-admin";
import { AssistantPageContext } from "@webiny/app-admin";
import { ToolPipelineRunner } from "@webiny/app-admin";
import { ToolRegistry } from "@webiny/app-admin";
import { PageEditorAssistantPresenter as Abstraction } from "./abstractions.js";
import { createPageEditorAccess } from "./createPageEditorAccess.js";
import { createPageEditorTools } from "./pageEditorTools.js";
import { describePage } from "./describePage.js";
import type { PageEditor } from "./types.js";

/**
 * Asked for the user when they open a page the assistant created elsewhere. The chat already holds
 * what the page should be, and the assistant said it would build it here.
 */
export const BUILD_QUESTION = "Build the page now.";

interface Connection {
    editor: PageEditor;
    context: AssistantPageContext.Owner;
    /*
     * Made once per editor. A call in flight holds on to the tools it was offered, and runs only if
     * they are still registered. A page opening turns read-only for a moment while its review state
     * loads (`PageReadOnlySync`); taking these same tools away and back keeps such a call valid,
     * where new ones would leave it pointing at tools that are gone.
     */
    tools: AssistantClientTools.Tool[];
    /** Set while the tools are on offer. */
    registration: AssistantClientTools.Owner | null;
    unsubscribe: () => void;
}

class PageEditorAssistantPresenterImpl implements Abstraction.Interface {
    private connection: Connection | null = null;
    /*
     * The panel asks for the build and the editor attaches from components of their own, in no set
     * order, so a request made first waits here for the editor.
     */
    private buildRequested = false;

    constructor(
        private clientTools: AssistantClientTools.Interface,
        private pageContext: AssistantPageContext.Interface,
        private pipelineRunner: ToolPipelineRunner.Interface,
        private toolRegistry: ToolRegistry.Interface,
        private assistant: AdminAssistantPresenter.Interface
    ) {}

    attach(editor: PageEditor): void {
        this.detach();

        const page = describePage(editor);
        const context = this.pageContext.set(page);
        // The outline follows the page as it changes, by hand or by the assistant.
        const unsubscribe = editor.onDocumentStateChange(() => this.refresh());
        const access = createPageEditorAccess(editor, this.pipelineRunner, this.toolRegistry);
        const tools = createPageEditorTools(access);

        this.connection = { editor, context, tools, registration: null, unsubscribe };
        this.syncTools();
    }

    syncTools(): void {
        const connection = this.connection;
        if (!connection) {
            return;
        }

        // A read-only editor shows a page that can't change, so it offers no tools to change it.
        const { isReadOnly } = connection.editor.getEditorState().read();
        if (isReadOnly && connection.registration) {
            this.clientTools.unregister(connection.registration);
            connection.registration = null;
        }
        if (!isReadOnly && !connection.registration) {
            connection.registration = this.clientTools.register(connection.tools);
        }

        this.buildIfRequested();
    }

    continueBuild(): void {
        this.buildRequested = true;
        this.buildIfRequested();
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
        const { context, registration, unsubscribe } = this.connection;
        unsubscribe();
        this.pageContext.clear(context);
        if (registration) {
            this.clientTools.unregister(registration);
        }
        this.connection = null;
    }

    // Asks only while the tools are on offer: without them there is nothing to build with.
    private buildIfRequested(): void {
        if (!this.buildRequested || !this.connection?.registration) {
            return;
        }
        this.buildRequested = false;

        // Opened in a new tab, the admin starts with no chat, so there is no plan to carry on.
        const { chatId, busy } = this.assistant.vm;
        if (!chatId || busy) {
            return;
        }
        this.assistant.ask(BUILD_QUESTION);
    }
}

export const PageEditorAssistantPresenterImplementation = Abstraction.createImplementation({
    implementation: PageEditorAssistantPresenterImpl,
    dependencies: [
        AssistantClientTools,
        AssistantPageContext,
        ToolPipelineRunner,
        ToolRegistry,
        AdminAssistantPresenter
    ]
});
