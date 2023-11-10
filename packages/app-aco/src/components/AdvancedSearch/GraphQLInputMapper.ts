import { FilterDTO } from "~/components/AdvancedSearch/domain";

export class GraphQLInputMapper {
    static toGraphQL(configuration: FilterDTO) {
        return {
            [configuration.operation]: configuration.groups.map(group => {
                return {
                    [group.operation]: group.filters.map(filter => {
                        const { field, condition, value } = filter;
                        const key = `${field}${condition}`.trim();

                        return { [key]: this.convertToBooleanOrString(value) };
                    })
                };
            })
        };
    }

    private static convertToBooleanOrString(value: string | boolean): string | boolean {
        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }

        return value ?? "";
    }
}
