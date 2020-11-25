import { OutputBlockData } from "@editorjs/editorjs";
import { PbCreateEditorValuePluginType } from "@webiny/app-page-builder/types";

export const createEditorValue = (): PbCreateEditorValuePluginType => {
    return {
        type: "pb-rte-create-editor-value",
        name: "pb-rte-create-editor-value-editorjs",
        create(text: string, type = "paragraph"): OutputBlockData {
            return {
                type,
                data: {
                    text
                }
            };
        }
    };
};
