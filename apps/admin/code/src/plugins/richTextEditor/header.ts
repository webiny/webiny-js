import Header from "@editorjs/header";

export default {
    type: "rich-text-editor-tool",
    toolName: "header",
    tool: {
        class: Header,
        levels: [2, 3, 4]
    }
};
