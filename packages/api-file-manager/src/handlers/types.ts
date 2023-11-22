export interface TransformHandlerEventPayload {
    body: {
        key: string;
        transformations: {
            width: number;
        };
    };
}
