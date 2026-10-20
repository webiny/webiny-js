import type { AiToolDto } from "./dto.js";
import type { AiTool } from "~/editor/domain/types.js";

export const mapAiTool = (dto: AiToolDto): AiTool => {
    return {
        name: dto.name,
        title: dto.title,
        description: dto.description,
        changesContent: dto.changesContent ?? false
    };
};
