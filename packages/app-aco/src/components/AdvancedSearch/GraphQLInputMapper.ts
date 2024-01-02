import { FilterDTO } from "~/components/AdvancedSearch/domain";

interface NestedObject {
    [key: string]: string | boolean | NestedObject;
}

export class GraphQLInputMapper {
    static toGraphQL(configuration: FilterDTO) {
        return {
            [configuration.operation]: configuration.groups.map(group => {
                return {
                    [group.operation]: group.filters.map(filter => {
                        const { field, condition, value } = filter;
                        return this.createNestedObject(
                            this.createKeys(field, condition),
                            this.convertToBooleanOrString(value)
                        );
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

    private static createKeys(field: string, condition: string): string[] {
        return `${field}${condition}`.trim().split(".");
    }

    private static createNestedObject(keys: string[], value: string | boolean): NestedObject {
        return keys.reduceRight((acc, key) => ({ [key]: acc }), value as unknown as NestedObject);
    }
}
