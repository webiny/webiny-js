import fs from "fs";
import imageSize from "image-size";
import processorFactory from "webiny-jimp";

describe("Image processor test", () => {
    let ip;
    let originalPNG;
    let originalJPEG;

    jest.setTimeout(10000);

    beforeEach(() => {
        ip = processorFactory();
        originalPNG = fs.readFileSync(__dirname + "/utils/lenna.png");
        originalJPEG = fs.readFileSync(__dirname + "/utils/lenna.jpg");
    });

    test(
        "should resize image",
        async () => {
            const transformations = [{ action: "resize", width: 20 }];

            const newImage = await ip({ image: originalPNG, transformations });
            const { width: newWidth, height: newHeight } = imageSize(newImage);

            expect(newWidth).toBe(20);
            expect(newHeight).toBe(20);
        },
        20000
    );

    test(
        "should crop image",
        async () => {
            const transformations = [{ action: "crop", width: 35, height: 35 }];

            const newImage = await ip({ image: originalPNG, transformations });
            const { width: newWidth, height: newHeight } = imageSize(newImage);

            expect(newWidth).toBe(35);
            expect(newHeight).toBe(35);
        },
        20000
    );

    test(
        "should change image quality",
        async () => {
            const quality = 90;
            const transformations = [{ action: "quality", quality }];

            const newImage = await ip({ image: originalJPEG, transformations });
            expect(newImage.length !== originalJPEG.length).toBe(true);
        },
        20000
    );
});
