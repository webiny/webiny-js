import { GraphQLContext, Plugin } from "@webiny/api/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";

export type CmsLocalizedModelFieldValue<T> = {
    locale: string;
    value: T;
};

export type CmsModelFieldValue<T> = {
    values: CmsLocalizedModelFieldValue<T>[];
};

export type CmsFieldValidation = {
    name: string;
    message: CmsModelFieldValue<string>;
    settings: { [key: string]: any };
};

export type CmsModelField = {
    _id: string;
    label: CmsModelFieldValue<string>;
    type: string;
    fieldId: string;
    validation: CmsFieldValidation[];
    settings?: { [key: string]: any };
};

export type CmsModelFieldValidatorPlugin = Plugin & {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate(params: {
            value: any;
            validator: CmsFieldValidation;
            context: GraphQLContext;
        }): Promise<boolean>;
    };
};

export type CmsModelFieldPatternValidatorPlugin = Plugin & {
    type: "cms-model-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
};

export type CmsModel = {
    title: string;
    description: string;
    modelId: string;
    fields: CmsModelField[];
};

export type CmsModelFieldToCommodoFieldPlugin<
    TContext = GraphQLContext & CommodoContext & I18NContext
> = Plugin & {
    type: "cms-model-field-to-commodo-field";
    fieldType: string;
    apply(params: {
        context: TContext;
        model: Function;
        field: CmsModelField;
        validation(value): Promise<boolean>;
    }): Function;
};
