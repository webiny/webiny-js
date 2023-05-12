import { toSlug } from "~/utils/toSlug";

describe("toSlug", () => {
    const cases: [string, string][] = [
        [
            "Some Really Strange Text with Sčecial Ćaracters čćžšđČĆŽŠĐ",
            "some-really-strange-text-with-scecial-caracters-cczsdjcczsdj"
        ],
        [`text 1<>!"#$%&'()?*+`, "text-1lessgreaterdollarpercentand"]
        // TODO determine if we want to change slug creation at this point
        // [`text .,<>!"#$%&'()=*?+/\\-`, "text"]
    ];
    it.each(cases)("should properly convert text to slug %s - %s", (input, expected) => {
        const result = toSlug(input);

        expect(result).toBe(expected);
    });
});
