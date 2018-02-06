declare type ExtractedData = {
    output: Object,
    processed: { characters: number }
};

declare type ExtractionOptions = {
    onRead?: Function,
    includeUndefined?: boolean
};

declare type ExtractionParams = {
    data?: {},
    output?: {},
    keys?: string,
    initialPath?: []
};

export { ExtractedData, ExtractionOptions, ExtractionParams };
