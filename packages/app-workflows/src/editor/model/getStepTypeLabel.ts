import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStepType } from "~/editor/domain/types.js";

const UI_NAMES: Record<string, string> = {
    [StepTypeId.Review]: "People",
    [StepTypeId.Automation]: "Automation",
    [StepTypeId.Ai]: "AI"
};

// The UI names of the known types (D98); an unknown type shows the server's title, else its id.
export const getStepTypeLabel = (type: string, stepTypes: EditorStepType[]): string => {
    const known = UI_NAMES[type];
    if (known !== undefined) {
        return known;
    }
    const listed = stepTypes.find(item => item.type === type);
    return listed ? listed.title : type;
};
