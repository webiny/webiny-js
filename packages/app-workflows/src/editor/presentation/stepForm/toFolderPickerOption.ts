import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";

// A folder as a picker option (R292, R307): the path is the label, with the `folder` icon.
export const toFolderPickerOption = (folder: AppFolder): PickerOption => {
    return {
        id: folder.id,
        label: folder.path,
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: "folder"
    };
};
