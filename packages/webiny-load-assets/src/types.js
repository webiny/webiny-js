// @flow
export type ArgumentProcessorType = {
    canProcess: any => boolean,
    process: any => ProcessedArgumentType
};

export type ProcessedArgumentType = Object & {
    type: "script" | "link",
    src: string
};

export type AssetLoaderType = {
    canProcess: ProcessedArgumentType => boolean,
    mustProcess: ProcessedArgumentType => boolean,
    process: ProcessedArgumentType => any
};
