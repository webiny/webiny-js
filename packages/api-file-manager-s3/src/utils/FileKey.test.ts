import { FileKey } from "./FileKey";

describe("FileKey", () => {
    it("should generate a file key (extension is included in the name)", () => {
        const fileKey = new FileKey({
            size: 1071690,
            name: "image-14.jpg",
            type: "image/jpeg"
        });

        expect(fileKey.toString()).toEqual("image-14.jpg");
    });

    it("should generate a file key (extension derived from file type)", () => {
        const fileKey = new FileKey({
            size: 1071690,
            name: "image-14",
            type: "image/jpeg"
        });

        expect(fileKey.toString()).toEqual("image-14.jpeg");
    });

    it("should generate a file key containing id", () => {
        const fileKey = new FileKey({
            size: 1071690,
            name: "image-14.jpeg",
            type: "image/jpeg",
            id: "12345678"
        });

        expect(fileKey.toString()).toEqual("12345678/image-14.jpeg");
    });

    it("should generate a file key containing prefix", () => {
        const fileKey = new FileKey({
            size: 1071690,
            name: "image-14.jpeg",
            type: "image/jpeg",
            keyPrefix: "prefix"
        });

        expect(fileKey.toString()).toEqual("prefix/image-14.jpeg");
    });

    it("should generate a file key containing id and prefix", () => {
        const fileKey = new FileKey({
            size: 1071690,
            name: "image-14.jpeg",
            type: "image/jpeg",
            id: "12345678",
            keyPrefix: "prefix"
        });

        expect(fileKey.toString()).toEqual("prefix/12345678/image-14.jpeg");
    });

    it("should use the key defined in the input", () => {
        const fileKey = new FileKey({
            size: 1071690,
            name: "image",
            type: "image/jpeg",
            key: "image-14.jpg"
        });

        expect(fileKey.toString()).toEqual("image-14.jpg");
    });
});
