import { validation, ValidationError } from "../src";

describe("url test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "url")).resolves.toBe(true);
    });

    it("should fail - invalid URL", async () => {
        await expect(validation.validate("asd", "url")).rejects.toThrow(ValidationError);
    });

    it('should fail - IP address is valid but "noIp" option is set', async () => {
        await expect(validation.validate("http://192.167.1.2", "url:noIp")).rejects.toThrow(
            ValidationError
        );
    });

    it('should pass - URL is valid and "noIp" option is set', async () => {
        await expect(validation.validate("http://www.google.com", "url:noIp")).resolves.toBe(true);
    });

    it("should fail - no TLD", async () => {
        await expect(validation.validate("http://abc", "url")).rejects.toThrow(ValidationError);
    });

    it("should pass - a valid IP was given", async () => {
        await expect(validation.validate("http://192.167.1.2", "url")).resolves.toBe(true);
    });

    it("should pass - a valid HTTP URL given", async () => {
        await expect(validation.validate("http://www.google.com", "url")).resolves.toBe(true);
    });

    it("should pass - a valid HTTPS URL given", async () => {
        await expect(validation.validate("https://www.google.com", "url")).resolves.toBe(true);
    });

    it("should pass - allow localhost", async () => {
        await expect(validation.validate("http://localhost", "url")).resolves.toBe(true);
        await expect(validation.validate("http://localhost/graphql", "url")).resolves.toBe(true);
        await expect(validation.validate("http://localhost:3000", "url")).resolves.toBe(true);
        await expect(validation.validate("http://localhost:3000/graphql", "url")).resolves.toBe(
            true
        );

        await expect(validation.validate("https://localhost", "url")).resolves.toBe(true);
        await expect(validation.validate("https://localhost/graphql", "url")).resolves.toBe(true);
        await expect(validation.validate("https://localhost:3000", "url")).resolves.toBe(true);
        await expect(validation.validate("https://localhost:3000/graphql", "url")).resolves.toBe(
            true
        );
    });

    it("should pass - allow relative URL", async () => {
        await expect(validation.validate("/relative/url?this=is", "url")).rejects.toThrow(
            ValidationError
        );
        await expect(
            validation.validate("/relative/url?this=is", "url:allowRelative")
        ).resolves.toBe(true);
    });

    it("should pass - href URL", async () => {
        await expect(validation.validate("#", "url")).rejects.toThrow(ValidationError);
        await expect(validation.validate("mailto:foo@bar.com", "url")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("#", "url:allowHref")).resolves.toBe(true);
        await expect(validation.validate("mailto:foo@bar.com", "url:allowHref")).resolves.toBe(
            true
        );
        await expect(validation.validate("mailt:", "url:allowHref")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("mailto:foo @ bar.com", "url:allowHref")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("tele:", "url:allowHref")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("#hello world", "url:allowHref")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass - Google Maps embed URL (with exclamation mark)", async () => {
        await expect(
            validation.validate(
                "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.6342726998337!2d-0.13235738423882193!3d51.51992537963726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b2de379bf0f%3A0x94d194cc3e61963a!2s3%20Gower%20St%2C%20London%20WC1E%206HA%2C%20Vereinigtes%20K%C3%B6nigreich!5e0!3m2!1sde!2sde!4v1638353426946!5m2!1sde!2sde",
                "url"
            )
        ).resolves.toBe(true);
    });
});
