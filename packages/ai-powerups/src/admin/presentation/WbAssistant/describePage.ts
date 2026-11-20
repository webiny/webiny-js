import type { AssistantPageContext } from "@webiny/app-admin";
import type { PageEditor } from "./types.js";
import { pageOutline } from "./pageOutline.js";
import { outlineLines } from "./outlineLines.js";

const TOOLS_HINT =
    "Change this page with the page editor tools (addPageElements and the rest). Call listPageComponents before the first change. Changes show on the canvas, and the editor saves them to the page's draft as they are made: there is no save step, so don't ask the user to save. Publishing is separate.";

const readString = (properties: Record<string, unknown>, key: string, fallback: string) => {
    const value = properties[key];
    return typeof value === "string" && value ? value : fallback;
};

/**
 * The page open in the editor, as the assistant is told of it: title, path, an outline of its
 * elements and the selected one. Ids and component names only; what an element holds is read with
 * `getPageElement`.
 */
export const describePage = (editor: PageEditor): AssistantPageContext.Data => {
    const page = editor.getDocumentState().read();
    const properties: Record<string, unknown> = page.properties ?? {};
    const title = readString(properties, "title", "Untitled");
    const path = readString(properties, "path", "");
    const { elements, truncated } = pageOutline(page);
    const { selectedElement } = editor.getEditorState().read();

    const details: Record<string, unknown> = {
        pageId: page.id,
        title,
        path,
        outline: outlineLines(elements),
        tools: TOOLS_HINT
    };
    if (page.status) {
        details["status"] = page.status;
    }
    if (truncated) {
        details["outlineTruncated"] = true;
    }
    if (selectedElement && page.elements[selectedElement]) {
        details["selectedElementId"] = selectedElement;
    }

    return { view: `The Website Builder page editor, editing the page "${title}"`, details };
};
