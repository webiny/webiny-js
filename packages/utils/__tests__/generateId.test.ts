import {
    generateAlphaLowerCaseId,
    generateAlphaNumericId,
    generateAlphaUpperCaseId,
    generateId,
    generateAlphaId
} from "~/generateId";

describe("Generate ID", () => {
    const sizes: (number | undefined)[] = [undefined, 7, 15, 22, 36];

    it.each(sizes)("should generate letter only id of size %s", size => {
        const result = generateAlphaId(size);

        expect(result).toMatch(/^([a-zA-Z]+)$/);
        expect(result).toHaveLength(size || 21);
    });

    it.each(sizes)("should generate lowercase letter only id of size %s", size => {
        const result = generateAlphaLowerCaseId(size);

        expect(result).toMatch(/^([a-z]+)$/);
        expect(result).toHaveLength(size || 21);
    });

    it.each(sizes)("should generate uppercase letter only id of size %s", size => {
        const result = generateAlphaUpperCaseId(size);

        expect(result).toMatch(/^([A-Z]+)$/);
        expect(result).toHaveLength(size || 21);
    });

    it.each(sizes)("should generate alphanumeric id of size %s", size => {
        const result = generateAlphaNumericId(size);

        expect(result).toMatch(/^([A-Za-z0-9]+)$/);
        expect(result).toHaveLength(size || 21);
    });

    it.each(sizes)("should generate id of size %s", size => {
        const result = generateId(size);

        expect(result).toMatch(/^([A-Za-z0-9_-]+)$/);
        expect(result).toHaveLength(size || 21);
    });
});
