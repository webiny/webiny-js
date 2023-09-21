import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryBuilder/domain";

//TODO: add a unit test
export class GraphQLInputMapper {
    static toGraphQL(configuration: QueryObjectDTO) {
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
