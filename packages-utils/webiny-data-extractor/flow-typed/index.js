declare type ExtractedData = {
    output: Object,
    processed: { characters: number }
};

declare type ExtractionOptions = {
    onRead?: Function,
    includeUndefined?: boolean
};

export { ExtractedData, ExtractionOptions };
