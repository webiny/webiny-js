import { matchKeyOrAlias } from "~/tasks/utils/helpers/matchKeyOrAlias";
import { GenericRecord } from "@webiny/api/types";

const cloudfrontUrl = "https://d1zqvydzhnfn89.cloudfront.net";

describe("match key or alias", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should log an error when given an invalid URL", () => {
        const errors: any[] = [];
        console.error = (...args: any[]) => {
            errors.push(...args);
        };

        const url = "invalid-url";

        const result = matchKeyOrAlias(url);

        expect(result).toBeNull();

        expect(errors).toHaveLength(2);
        expect(errors[0]).toEqual(`Url "${url}" is not valid.`);
        expect(errors[1].code).toEqual("ERR_INVALID_URL");
        expect(errors[1].input).toEqual(url);
    });

    it("should properly match a public file", () => {
        const keys: GenericRecord<string, string> = {
            "files/a-key/next.jpg": "a-key/next.jpg",
            "files/private/a-key/next.jpg": "private/a-key/next.jpg",
            "files/666bfc2abacd2d0008acbfbf/a-image.jpeg": "666bfc2abacd2d0008acbfbf/a-image.jpeg"
        };

        const errors: any[] = [];
        console.error = (...args: any[]) => {
            errors.push(...args);
        };

        expect.assertions(Object.keys(keys).length + 1);

        for (const key in keys) {
            const expected = keys[key];
            const result = matchKeyOrAlias(`${cloudfrontUrl}/${key}`);

            expect(result).toEqual({
                key: expected
            });
        }
        expect(errors).toHaveLength(0);
    });

    it("should properly match a private", () => {
        const keys: GenericRecord<string, string> = {
            "private/a-key/next.jpg": "a-key/next.jpg",
            "private/files/a-key/next.jpg": "files/a-key/next.jpg",
            "private/666bfc2abacd2d0008acbfbf/a-image.jpeg": "666bfc2abacd2d0008acbfbf/a-image.jpeg"
        };

        const errors: any[] = [];
        console.error = (...args: any[]) => {
            errors.push(...args);
        };

        expect.assertions(Object.keys(keys).length + 1);

        for (const key in keys) {
            const expected = keys[key];
            const result = matchKeyOrAlias(`${cloudfrontUrl}/${key}`);

            expect(result).toEqual({
                key: expected
            });
        }
        expect(errors).toHaveLength(0);
    });

    it("should properly match alias", () => {
        const keys: GenericRecord<string, string> = {
            "/a-key/next.jpg": "/a-key/next.jpg"
        };

        for (const alias in keys) {
            const value = keys[alias];
            const result = matchKeyOrAlias(`${cloudfrontUrl}${value}`);

            expect(result).toEqual({
                alias
            });
        }
    });
});
