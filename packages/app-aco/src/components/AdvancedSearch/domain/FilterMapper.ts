import { Filter, FilterDTO, FilterStorage } from "../domain";

export class FilterMapper {
    static toDTO(configuration: Filter | FilterDTO): FilterDTO {
        return {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description || "",
            operation: configuration.operation,
            createdOn: configuration.createdOn || "",
            groups: configuration.groups.map(group => ({
                operation: group.operation,
                filters: group.filters.map(filter => ({
                    field: filter.field || "",
                    value: (filter.value ?? "").toString(),
                    condition: filter.condition || ""
                }))
            }))
        };
    }

    static toStorage(configuration: Filter | FilterDTO): FilterStorage {
        return {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description,
            operation: configuration.operation,
            groups: configuration.groups.map(group => ({
                operation: group.operation,
                filters: group.filters.map(filter => ({
                    field: filter.field || "",
                    value: (filter.value ?? "").toString(),
                    condition: filter.condition || ""
                }))
            }))
        };
    }
}
