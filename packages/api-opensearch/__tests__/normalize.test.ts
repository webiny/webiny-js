import { describe, expect, it } from "vitest";
import { normalizeValue } from "~/normalize.js";
import { normalizeValueWithAsterisk } from "~/normalize.js";

describe(`GraphQL "contains" operator - query normalization`, () => {
    it.each([
        ["Sembach Germany", "Sembach Germany"],
        ["Sembach\\Germany", "Sembach Germany"],
        [
            "AE0003 - VFW Post 12139 Donnersberg, Sembach-Germany",
            "AE0003 VFW Post 12139 Donnersberg Sembach Germany"
        ],
        ["Climbing 11/14", "Climbing 11 14"],
        ["Climbing 11/", "Climbing 11"],
        ["Roadtest: Best Cars", "Roadtest Best Cars"],
        ["Q&A Session", "Q A Session"],
        ["C++ Programming", "C Programming"],
        ["C# Basics", "C Basics"],
        ['"Quoted" Title', "Quoted Title"],
        ["Price (USD) [net]", "Price USD net"],
        ["Tom & Jerry's {Show}", "Tom Jerry's Show"],
        ["50% Off!", "50 Off"],
        ["user@example.com", "user example.com"],
        ["What? Why!", "What Why"],
        ["a+b=c", "a b c"],
        ["Hello~World", "Hello World"],
        ["1.5 * 2", "1.5 2"],
        ["e-mail <test>", "e mail test"],
        ["foo^bar", "foo bar"],
        ["x|y z", "x y z"],
        ["Section #5", "Section 5"],
        ['+ 1 - = && || > < ! ( A ) { } [ ] ^ " ~ * ? : \\ 2 /', "1 A 2"]
    ])("should turn punctuation in %j into gaps between words", (value, expected) => {
        expect(normalizeValue(value)).toBe(expected);
    });

    it.each([
        ["Node.js Guide", "Node.js Guide"],
        ["v1.2.3 release", "v1.2.3 release"],
        ["Rock'n'Roll", "Rock'n'Roll"],
        ["snake_case_name", "snake_case_name"],
        ["Price 1,000 units", "Price 1,000 units"],
        ["Café Déjà vu", "Café Déjà vu"],
        ["O’Reilly Media", "O’Reilly Media"],
        ["O‘Reilly Media", "O‘Reilly Media"],
        ["カタカナ 한국어", "カタカナ 한국어"]
    ])("should keep %j as the words the analyzer indexes", (value, expected) => {
        expect(normalizeValue(value)).toBe(expected);
    });

    it.each([
        ["Cars. More", "Cars More"],
        ["...Ellipsis", "Ellipsis"],
        ["'quoted'", "quoted"],
        ["Node.", "Node"],
        ["abc.123", "abc 123"],
        ["90's music", "90 s music"]
    ])("should drop a dot or an apostrophe at the edge of a word in %j", (value, expected) => {
        expect(normalizeValue(value)).toBe(expected);
    });

    it.each([
        ["Roadtest:Best", "Roadtest\\:Best"],
        ["Ratio 3:2", "Ratio 3 2"],
        ["Ratio 3,", "Ratio 3"],
        ["a,b", "a b"],
        ["Score 3;4", "Score 3;4"],
        ["a;b", "a b"]
    ])(
        "should keep a colon only between letters and a comma only between digits in %j",
        (value, expected) => {
            expect(normalizeValue(value)).toBe(expected);
        }
    );

    it.each([
        ["東京タワー", "東 京 タワー"],
        ["ひらがな", "ひ ら が な"]
    ])(
        "should split %j into the characters the analyzer indexes one at a time",
        (value, expected) => {
            expect(normalizeValue(value)).toBe(expected);
        }
    );

    it.each([
        ["Terms AND/OR conditions", "Terms and or conditions"],
        ["Rock NOT Roll", "Rock not Roll"],
        ["ANDROID ORBIT NOTE", "ANDROID ORBIT NOTE"]
    ])("should search for AND, OR and NOT in %j as words", (value, expected) => {
        expect(normalizeValue(value)).toBe(expected);
    });

    it.each([
        ["", ""],
        ["   ", ""],
        ['"', ""],
        ["...", ""]
    ])("should return an empty string for %j", (value, expected) => {
        expect(normalizeValue(value)).toBe(expected);
        expect(normalizeValueWithAsterisk(value)).toBe(expected);
    });

    it.each([
        ["Climbing", "*Climbing*"],
        ["Climbing 11/14", "*Climbing 11 14*"],
        ["Climbing 11/", "*Climbing 11*"],
        ["Roadtest:B", "*Roadtest\\:B*"],
        ["Café Dé", "*Café Dé*"],
        ["snake_", "*snake_*"],
        ["東京", "*東 京*"]
    ])("should put a wildcard around %j", (value, expected) => {
        expect(normalizeValueWithAsterisk(value)).toBe(expected);
    });
});
