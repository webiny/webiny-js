import { QueryObject, QueryObjectDTO } from "./QueryObject";

export class QueryObjectMapper {
    static toDTO(configuration: QueryObject | QueryObjectDTO): QueryObjectDTO {
        return {
            id: configuration.id,
            name: configuration.name,
            operation: configuration.operation,
            groups: configuration.groups.map(group => ({
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
