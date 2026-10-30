import type { AiToolDto } from "./dto.js";
import type { AiTool } from "~/editor/domain/types.js";

export const mapAiTool = (dto: AiToolDto): AiTool => {
    return {
        name: dto.name,
        label: dto.label,
        summary: dto.summary,
        changesContent: dto.changesContent ?? false
    };
};
