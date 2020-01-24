import { validation, ValidationError } from "../src";

describe("url test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "url")).resolves.toBe(true);
    });

    it("should fail - invalid URL", () => {
        expect(validation.validate("asd", "url")).rejects.toThrow(ValidationError);
    });

    it('should fail - IP address is valid but "noIp" option is set', () => {
        expect(validation.validate("http://192.167.1.2", "url:noIp")).rejects.toThrow(
            ValidationError
        );
    });

    it('should pass - URL is valid and "noIp" option is set', () => {
        expect(validation.validate("http://www.google.com", "url:noIp")).resolves.toBe(true);
    });

    it("should fail - no TLD", () => {
        expect(validation.validate("http://abc", "url")).rejects.toThrow(ValidationError);
    });

    it("should pass - a valid IP was given", () => {
        expect(validation.validate("http://192.167.1.2", "url")).resolves.toBe(true);
    });

    it("should pass - a valid HTTP URL given", () => {
        expect(validation.validate("http://www.google.com", "url")).resolves.toBe(true);
    });

    it("should pass - a valid HTTPS URL given", () => {
        expect(validation.validate("https://www.google.com", "url")).resolves.toBe(true);
    });

    it("should pass - allow localhost", () => {
        expect(validation.validate("http://localhost", "url")).resolves.toBe(true);
        expect(validation.validate("http://localhost/graphql", "url")).resolves.toBe(true);
        expect(validation.validate("http://localhost:3000", "url")).resolves.toBe(true);
        expect(validation.validate("http://localhost:3000/graphql", "url")).resolves.toBe(true);

        expect(validation.validate("https://localhost", "url")).resolves.toBe(true);
        expect(validation.validate("https://localhost/graphql", "url")).resolves.toBe(true);
        expect(validation.validate("https://localhost:3000", "url")).resolves.toBe(true);
        expect(validation.validate("https://localhost:3000/graphql", "url")).resolves.toBe(true);
    });

    it("should pass - allow relative URL", () => {
        expect(validation.validate("/relative/url?this=is", "url")).rejects.toThrow(
            ValidationError
        );
        expect(validation.validate("/relative/url?this=is", "url:allowRelative")).resolves.toBe(
            true
        );
    });
});
