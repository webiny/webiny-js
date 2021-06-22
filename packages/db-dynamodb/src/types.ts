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
 * A type that is defining the attribute input.
 */
export type DynamoDbAttributePluginAttributeParams =
    | DynamoDBTypes
    | EntityAttributeConfig
    | EntityCompositeAttributes;

/**
 * A plugin that is used to add new attributes to existing entities used in our system.
 */
export interface DynamoDbAttributePluginArgs {
    entity: string;
    attribute: string;
    params: DynamoDbAttributePluginAttributeParams;
}
