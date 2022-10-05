import { pluralizedTypeName } from "~/utils/pluralizedTypeName";

describe("pluralize string value", () => {
    const cases: [string, string][] = [
        ["Model", "Models"],
        ["A", "As"],
        ["Build", "Builds"]
    ];
    it.each(cases)("should pluralize string value %s - %s", (input, expected) => {
        const result = pluralizedTypeName(input);

        expect(result).toEqual(expected);
    });
});
