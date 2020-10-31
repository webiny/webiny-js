import Quote from "@editorjs/quote";

export default {
    type: "rich-text-editor-tool",
    toolName: "quote",
    tool: {
        class: Quote,
        inlineToolbar: true,
    }
};
