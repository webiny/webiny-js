import { fieldFromDto } from "../../../shared/models/fields/fieldFactory";

export const FUB_PAGE_ELEMENT_GROUP = "funnelBuilder";

export const createInitialFieldData = (fieldType: string) => {
    const field = fieldFromDto({ type: fieldType, stepId: "" });
    return field.toDto();
};
