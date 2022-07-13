export interface UpdateDocumentActionArgsType<TDocument = unknown> {
    document?: TDocument;
    debounce?: boolean;
    history?: boolean;
    onFinish?: () => void;
}
