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
