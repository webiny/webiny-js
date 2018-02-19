import { validation } from "./../lib";
import "./chai";

describe("url test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "url").should.be.fulfilled;
    });

    it("should fail - invalid URL", () => {
        return validation.validate("asd", "url").should.be.rejected;
    });

    it('should fail - IP address is valid but "noIp" option is set', () => {
        return validation.validate("http://192.167.1.2", "url:noIp").should.be.rejected;
    });

    it('should pass - URL is valid and "noIp" option is set', () => {
        return validation.validate("http://www.google.com", "url:noIp").should.become(true);
    });

    it("should fail - no TLD", () => {
        return validation.validate("http://localhost", "url").should.be.rejected;
    });

    it("should pass - a valid IP was given", () => {
        return validation.validate("http://192.167.1.2", "url").should.become(true);
    });

    it("should pass - a valid HTTP URL given", () => {
        return validation.validate("http://www.google.com", "url").should.become(true);
    });

    it("should pass - a valid HTTPS URL given", () => {
        return validation.validate("https://www.google.com", "url").should.become(true);
    });
});
