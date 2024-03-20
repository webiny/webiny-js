import { Meta, MetaDTO } from "~/domain/Meta";

export class MetaMapper {
    static toDto(data: Meta | MetaDTO): MetaDTO {
        return {
            totalCount: data.totalCount ?? 0,
            cursor: data.cursor ?? null,
            hasMoreItems: data.hasMoreItems ?? false
        };
    }
}
