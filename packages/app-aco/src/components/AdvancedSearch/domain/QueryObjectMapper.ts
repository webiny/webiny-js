import {
    QueryObjectGroup,
    QueryObject,
    QueryObjectDTO,
    FilterRaw,
    Filter,
    FilterDTO
} from "../domain";

export class QueryObjectMapper {
    static toDTO(configuration: QueryObject | Filter | FilterDTO | FilterRaw): QueryObjectDTO {
        const groups: QueryObjectGroup[] = configuration.groups.map(group => {
            if (typeof group === "string") {
                return JSON.parse(group);
            }

            return group;
        });

        return {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description || "",
            modelId: configuration.modelId,
            operation: configuration.operation,
            groups: groups.map(group => ({
                operation: group.operation,
                filters: group.filters.map(filter => ({
                    field: filter.field || "",
                    value: filter.value || "",
                    condition: filter.condition || ""
                }))
            }))
        };
    }
}
