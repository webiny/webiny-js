// @vitest-environment jsdom
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { AdminAssistantPresenter } from "@webiny/app-admin";
import { AssistantClientTools } from "@webiny/app-admin";
import { AssistantClientToolsFeature } from "@webiny/app-admin";
import { AssistantPageContextFeature } from "@webiny/app-admin";
import { ToolPipelineRunner } from "@webiny/app-admin";
import { ToolRegistry } from "@webiny/app-admin";
import { PageEditorAssistantFeature } from "~/admin/presentation/WbAssistant/feature.js";
import { BUILD_QUESTION } from "~/admin/presentation/WbAssistant/PageEditorAssistantConnector.js";
import type { PageEditor } from "~/admin/presentation/WbAssistant/types.js";

/** An editor with an empty page, whose read-only flag the test flips. */
const fakeEditor = () => {
    const state = { isReadOnly: false };
    const editor = {
        getEditorState: () => ({
            read: () => ({ isReadOnly: state.isReadOnly, components: {}, selectedElement: null })
        }),
        getDocumentState: () => ({
            read: () => ({
                id: "page-1",
                properties: { title: "Bike Workshop", path: "/bike-workshop" },
                elements: {
                    root: { type: "Webiny/Element", id: "root", component: { name: "Root" } }
                },
                bindings: {}
            })
        }),
        onDocumentStateChange: () => () => {}
    };

    return {
        editor: editor as unknown as PageEditor,
        setReadOnly: (isReadOnly: boolean) => {
            state.isReadOnly = isReadOnly;
        }
    };
};

const setup = (chat: { chatId: string | null; busy?: boolean } = { chatId: "chat-1" }) => {
    const container = new Container();
    const asked: string[] = [];

    AssistantClientToolsFeature.register(container);
    AssistantPageContextFeature.register(container);
    container.registerInstance(ToolPipelineRunner, {} as ToolPipelineRunner.Interface);
    container.registerInstance(ToolRegistry, {
        getTools: () => []
    } as unknown as ToolRegistry.Interface);
    container.registerInstance(AdminAssistantPresenter, {
        vm: { chatId: chat.chatId, busy: chat.busy ?? false },
        ask: (question: string) => asked.push(question)
    } as unknown as AdminAssistantPresenter.Interface);
    PageEditorAssistantFeature.register(container);

    return {
        connector: PageEditorAssistantFeature.resolve(container).connector,
        clientTools: container.resolve(AssistantClientTools),
        asked
    };
};

const listComponents = { toolCallId: "call-1", toolName: "listPageComponents", input: {} };

describe("PageEditorAssistantConnector", () => {
    it("offers no tools while the editor is read-only, and the same tools again after", () => {
        const { connector, clientTools } = setup();
        const { editor, setReadOnly } = fakeEditor();

        connector.attach(editor);
        const offered = clientTools.list();
        expect(offered.map(tool => tool.name)).toContain("listPageComponents");

        setReadOnly(true);
        connector.syncTools();
        expect(clientTools.list()).toEqual([]);

        setReadOnly(false);
        connector.syncTools();
        expect(clientTools.list()).toEqual(offered);
    });

    it("runs a call offered before the editor turned read-only and back", async () => {
        const { connector, clientTools } = setup();
        const { editor, setReadOnly } = fakeEditor();

        connector.attach(editor);
        const offered = clientTools.list();

        // What a page does as it opens, while its review state loads.
        setReadOnly(true);
        connector.syncTools();
        setReadOnly(false);
        connector.syncTools();

        const result = await clientTools.run(listComponents, offered);
        expect(result.error).toBeUndefined();
    });

    it("asks to build the page once the editor offers its tools", () => {
        const { connector, asked } = setup();
        const { editor, setReadOnly } = fakeEditor();

        // The panel asks before the editor is attached, and the editor opens read-only.
        connector.continueBuild();
        setReadOnly(true);
        connector.attach(editor);
        expect(asked).toEqual([]);

        setReadOnly(false);
        connector.syncTools();
        expect(asked).toEqual([BUILD_QUESTION]);

        // Once: the tools being offered again later asks nothing more.
        setReadOnly(true);
        connector.syncTools();
        setReadOnly(false);
        connector.syncTools();
        expect(asked).toEqual([BUILD_QUESTION]);
    });

    it("drops a build request when its editor closes without becoming editable", () => {
        const { connector, asked } = setup();
        const first = fakeEditor();
        first.setReadOnly(true);

        connector.continueBuild();
        connector.attach(first.editor);
        connector.detach();

        // The next page opened is editable; it was not the one the request was for.
        connector.attach(fakeEditor().editor);
        expect(asked).toEqual([]);
    });

    it("asks nothing with no chat to carry on, or while the chat is running", () => {
        for (const chat of [{ chatId: null }, { chatId: "chat-1", busy: true }]) {
            const { connector, asked } = setup(chat);
            connector.attach(fakeEditor().editor);
            connector.continueBuild();
            expect(asked).toEqual([]);
        }
    });
});
