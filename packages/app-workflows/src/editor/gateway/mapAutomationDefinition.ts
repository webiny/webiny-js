import type { AutomationDefinitionDto } from "./dto.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import { toJsonSchema } from "./toJsonSchema.js";

export const mapAutomationDefinition = (dto: AutomationDefinitionDto): AutomationDefinition => {
    return {
        id: dto.id,
        name: dto.name,
        models: dto.models,
        settingsSchema: toJsonSchema(dto.settingsSchema)
    };
};
