import { ModelFieldBuilder, Params as BaseParams } from "./ModelFieldBuilder";

export type Params = Omit<BaseParams, "type" | "label">;
export interface RefParams extends Params {
    settings: {
        models: { modelId: string }[];
    };
}

export const booleanFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "boolean"
    });
};

export const numberFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "number"
    });
};

export const fileFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "file"
    });
};

export const textFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "text"
    });
};

export const longTextFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "long-text"
    });
};

export const richTextFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "rich-text"
    });
};

export const refFieldBuilderFactory = (params: RefParams): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "ref"
    });
};

export const dateFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "datetime",
        settings: {
            type: "date"
        }
    });
};

export const timeFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "datetime",
        settings: {
            type: "time"
        }
    });
};

export const dateTimeFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "datetime",
        settings: {
            type: "dateTimeWithoutTimezone"
        }
    });
};

export const dateTimeWithTimeZoneFieldBuilderFactory = (params: Params = {}): ModelFieldBuilder => {
    return new ModelFieldBuilder({
        ...params,
        type: "datetime",
        settings: {
            type: "dateTimeWithTimezone"
        }
    });
};
