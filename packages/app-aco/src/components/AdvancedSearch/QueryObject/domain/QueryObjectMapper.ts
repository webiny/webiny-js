import { QueryObject, QueryObjectDTO } from "./QueryObject";
import { Group, QueryObjectRaw } from "../domain";

export class QueryObjectMapper {
    static toDTO(configuration: QueryObject | QueryObjectRaw): QueryObjectDTO {
        const groups: Group[] = configuration.groups.map(group => {
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

    static toRaw(configuration: QueryObject | QueryObjectDTO): QueryObjectRaw {
        return {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description,
            modelId: configuration.modelId,
            operation: configuration.operation,
            groups: configuration.groups.map(group => JSON.stringify(group))
        };
    }
}
