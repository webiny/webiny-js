export type ImageProcessor = ({
    image: Buffer,
    transformations: Array<{ action: string }>
}) => Buffer;
