import List from "@editorjs/list";

export default {
    type: "rich-text-editor-tool",
    toolName: "list",
    tool: {
        class: List,
        inlineToolbar: true
    }
};
