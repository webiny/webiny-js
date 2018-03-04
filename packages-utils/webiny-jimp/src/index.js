// @flow
import jimp from "jimp";

export default () => {
    return async (params: { image: Buffer, transformations: Array<Object> }): Promise<Buffer> => {
        const { image, transformations } = params;
        let img = await jimp.read(image);
        const AUTO = jimp.AUTO;

        for (let i = 0; i < transformations.length; i++) {
            const { action, ...params } = transformations[i];
            let { width, height, x, y } = params;

            switch (action) {
                case "resize":
                    img = await img.resize(width || AUTO, height || AUTO);
                    break;
                case "crop":
                    img = await img.crop(x || AUTO, y || AUTO, width || AUTO, height || AUTO);
                    break;
                case "quality":
                    await img.quality(params.quality);
                    break;
            }
        }

        return new Promise(resolve => {
            return img.getBuffer(AUTO, (err, buffer) => {
                resolve(buffer);
            });
        });
    };
};
