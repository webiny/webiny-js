import { QueryObjectGroup, Filter, FilterRaw, FilterDTO } from "../domain";

export class FilterMapper {
    static toDTO(configuration: Filter | FilterRaw): FilterDTO {
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
            })),
            createdBy: configuration.createdBy || {
                id: "",
                displayName: "",
                type: ""
            },
            createdOn: configuration?.createdOn || "",
            savedOn: configuration.savedOn || ""
        };
    }

    static toRaw(configuration: Filter | FilterDTO): FilterRaw {
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
