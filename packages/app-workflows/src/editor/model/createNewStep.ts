import { DEFAULT_STEP_COLOUR } from "~/editor/domain/stepColours.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "./createDefaultAssignment.js";

const EMAIL_TRANSPORT_ID = "e-mail";

export interface NewStepParams {
    id: string;
    type: string;
    transports: NotificationTransport[];
}

const createConfig = (type: string): unknown => {
    if (type === StepTypeId.Review) {
        return { teams: [], assignment: createDefaultAssignment() };
    }
    if (type === StepTypeId.Automation) {
        return { automationId: "", settings: {} };
    }
    if (type === StepTypeId.Ai) {
        return { instructions: "", model: "", tools: [] };
    }
    return {};
};

/*
 * A new step (R270, R272, R273): Orange, no title, the config defaults of its type, and for a People
 * step `e-mail` ticked when that transport exists (QBZ-45).
 */
export const createNewStep = (params: NewStepParams): EditorStep => {
    const hasEmail = params.transports.some(transport => transport.id === EMAIL_TRANSPORT_ID);
    const ticked = params.type === StepTypeId.Review && hasEmail;

    return {
        id: params.id,
        title: "",
        color: DEFAULT_STEP_COLOUR,
        description: null,
        type: params.type,
        notificationIds: ticked ? [EMAIL_TRANSPORT_ID] : [],
        config: createConfig(params.type)
    };
};
