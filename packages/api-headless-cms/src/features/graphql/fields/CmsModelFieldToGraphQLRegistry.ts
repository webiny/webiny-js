import { CmsModelFieldToGraphQLRegistry as CmsModelFieldToGraphQLRegistryAbstraction } from "./abstractions/CmsModelFieldToGraphQLRegistry.js";
import { CmsModelFieldToGraphQL } from "./abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldType } from "~/types/modelField.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

class CmsModelFieldToGraphQLRegistryImpl
    implements CmsModelFieldToGraphQLRegistryAbstraction.Interface
{
    public constructor(private readonly fields: CmsModelFieldToGraphQL.Interface[]) {}

    public get(type: CmsModelFieldType): CmsModelFieldToGraphQL.Interface | undefined {
        const fieldType = getBaseFieldType({
            type
        });
        return this.fields.find(field => {
            return field.fieldType === fieldType;
        });
    }

    public getAll(): CmsModelFieldToGraphQL.Interface[] {
        return this.fields;
    }
}

export const CmsModelFieldToGraphQLRegistry =
    CmsModelFieldToGraphQLRegistryAbstraction.createImplementation({
        implementation: CmsModelFieldToGraphQLRegistryImpl,
        dependencies: [[CmsModelFieldToGraphQL, { multiple: true }]]
    });
