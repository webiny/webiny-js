import { CmsModelFieldToGraphQLRegistry as CmsModelFieldToGraphQLRegistryAbstraction } from "./abstractions/CmsModelFieldToGraphQLRegistry.js";
import { CmsModelFieldToGraphQL } from "./abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import type { CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { convertFromImplementationsToPlugins } from "~/features/graphql/fields/convertFromImplementationsToPlugins.js";

class CmsModelFieldToGraphQLRegistryImpl
    implements CmsModelFieldToGraphQLRegistryAbstraction.Interface
{
    public constructor(private readonly fields: CmsModelFieldToGraphQL.Interface[]) {}

    public get(fieldType: CmsModelFieldType): CmsModelFieldToGraphQL.Interface | undefined {
        return this.fields.find(field => {
            return field.getFieldType() === fieldType;
        });
    }

    public getAll(): CmsModelFieldToGraphQL.Interface[] {
        return this.fields;
    }

    public getAllAsPlugins(): CmsModelFieldToGraphQLPlugin[] {
        return convertFromImplementationsToPlugins(this.fields);
    }

    public getAllAsPluginRecords(): Record<string, CmsModelFieldToGraphQLPlugin> {
        return this.getAllAsPlugins().reduce<Record<string, CmsModelFieldToGraphQLPlugin>>(
            (acc, plugin) => {
                acc[plugin.fieldType] = plugin;
                return acc;
            },
            {}
        );
    }
}

export const CmsModelFieldToGraphQLRegistry =
    CmsModelFieldToGraphQLRegistryAbstraction.createImplementation({
        implementation: CmsModelFieldToGraphQLRegistryImpl,
        dependencies: [[CmsModelFieldToGraphQL, { multiple: true }]]
    });
