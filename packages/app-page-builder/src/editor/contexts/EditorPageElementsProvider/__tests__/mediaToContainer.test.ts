import { mediaToContainer } from "../mediaToContainer";

describe("mediaToContainer function should correctly transform @media into @container queries", () => {
    it("should correctly transform max-width", async () => {
        expect(mediaToContainer("@media (max-width: 4000px)")).toBe(
            "@container page-editor-canvas (max-width: 4000px)"
        );
    });

    it("should correctly transform min-width", async () => {
        expect(mediaToContainer("@media (min-width: 4000px)")).toBe(
            "@container page-editor-canvas (min-width: 4000px)"
        );
    });

    it("should correctly transform when both max-width and min-width are used", async () => {
        expect(mediaToContainer("@media screen and (min-width: 10px) and (max-width: 15px)")).toBe(
            "@container page-editor-canvas (min-width: 10px) and (max-width: 15px)"
        );
    });

    it("should correctly transform when different units are used", async () => {
        expect(mediaToContainer("@media screen and (min-width: 10em) and (max-width: 15vh)")).toBe(
            "@container page-editor-canvas (min-width: 10em) and (max-width: 15vh)"
        );
    });
});
