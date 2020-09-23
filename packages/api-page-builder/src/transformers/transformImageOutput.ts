type ImageMeta = {
    width: number;
    height: number;
    aspectRatio: number;
    private: boolean;
};
type Image = {
    id: string;
    name: string;
    size: number;
    type: string;
    meta: ImageMeta | null;
};

const transformImageOutput = (typeName: string, image: Image | undefined, srcPrefix: string) => {
    if (!image) {
        return null;
    }
    const { meta } = image;
    const response = {
        __typename: typeName,
        id: image.id,
        src: `${srcPrefix}${image.name}`,
        name: image.name,
        size: image.size,
        type: image.type,
        meta: null
    };
    if (!meta) {
        return response;
    }
    return {
        ...response,
        meta: {
            width: meta.width,
            height: meta.height,
            aspectRatio: meta.aspectRatio,
            private: meta.private
        }
    };
};

export { transformImageOutput };
