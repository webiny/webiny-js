import { SearchConfiguration, SearchConfigurationDTO } from "./SearchConfiguration";

// interface ISearchConfigurationMapper<T> {
//     map(configuration: SearchConfiguration): T;
// }
//
// class GraphQLMapper implements ISearchConfigurationMapper<Record<string, any>> {
//     map(configuration: SearchConfiguration): Record<string, any> {
//         return {
//             [configuration.operation]: configuration.groups.map(group => {
//                 return {
//                     [group.operation]: group.filters.map(filter => {
//                         const { field, condition, value } = filter;
//                         const key = `${field}${condition}`.trim();
//
//                         return { [key]: value };
//                     })
//                 };
//             })
//         };
//     }
// }
//
// class XMLMapper implements ISearchConfigurationMapper<string> {
//     map(configuration: SearchConfiguration): string {
//         return `<xml>....</xml>`;
//     }
// }

export class SearchConfigurationMapper {
    static toDTO(configuration: SearchConfiguration): SearchConfigurationDTO {
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

    static toGraphQL(configuration: SearchConfiguration) {
        return {
            [configuration.operation]: configuration.groups.map(group => {
                return {
                    [group.operation]: group.filters.map(filter => {
                        const { field, condition, value } = filter;
                        const key = `${field}${condition}`.trim();

                        return { [key]: value };
                    })
                };
            })
        };
    }
}
