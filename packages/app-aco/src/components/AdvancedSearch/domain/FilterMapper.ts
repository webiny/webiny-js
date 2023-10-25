import { FilterRaw, Filter, FilterDTO, FilterGroup } from "../domain";

export class FilterMapper {
    static toDTO(configuration: Filter | FilterRaw): FilterDTO {
        const groups: FilterGroup[] = configuration.groups.map(group => {
            if (typeof group === "string") {
                return JSON.parse(group);
            }
            return group;
        });

        return {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description || "",
            operation: configuration.operation,
            createdOn: configuration.createdOn || "",
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

    static toRaw(configuration: Filter | FilterDTO): FilterRaw {
        return {
            id: configuration.id,
            name: configuration.name,
            description: configuration.description,
            operation: configuration.operation,
            groups: configuration.groups.map(group => JSON.stringify(group))
        };
    }
}
