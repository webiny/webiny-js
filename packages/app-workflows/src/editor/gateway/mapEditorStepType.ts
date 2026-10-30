import type { EditorStepTypeDto } from "./dto.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { toJsonSchema } from "./toJsonSchema.js";

export const mapEditorStepType = (dto: EditorStepTypeDto): EditorStepType => {
    return {
        type: dto.type,
        title: dto.title,
        available: dto.available,
        unavailableReason: dto.unavailableReason ?? null,
        configSchema: toJsonSchema(dto.configSchema)
    };
};
