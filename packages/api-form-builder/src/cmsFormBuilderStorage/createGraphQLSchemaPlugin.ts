import { createFormBuilderSettingsSchema } from "~/plugins/graphql/formSettings";
import { createFormSchema } from "~/plugins/graphql/form";
import { createBaseSchema } from "~/plugins/graphql";

export const createGraphQLSchemaPlugin = () => {
    return [createBaseSchema(), createFormBuilderSettingsSchema(), createFormSchema()];
};
