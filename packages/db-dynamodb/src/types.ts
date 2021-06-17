import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";

export type OperatorArgs = {
    expression: string;
    attributeNames: Record<string, any>;
    attributeValues: Record<string, any>;
};

type CanProcessArgs = {
    key: string;
    value: any;
    args: OperatorArgs;
};

type ProcessArgs = {
    key: string;
    value: any;
    args: OperatorArgs;
    processStatement: any;
};

export type Operator = {
    canProcess: ({ key }: CanProcessArgs) => boolean;
    process: ({ key, value, args }: ProcessArgs) => void;
};
/**
 * A type that is defining the input and part of the output of the DynamoDbAttributePlugin.
 * Plugin is used to add new attributes to existing entities used in our system.
 */
export type DynamoDbAttributePluginParams =
    | DynamoDBTypes
    | EntityAttributeConfig
    | EntityCompositeAttributes;
