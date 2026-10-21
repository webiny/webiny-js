import { describe, it, expect } from "vitest";
import { PublicUrl } from "../PublicUrl.js";

describe("PublicUrl", () => {
    it.each([undefined, null, 42, "", "   ", "not a url", "api.example.com", "ftp://example.com"])(
        "returns null for %j",
        value => {
            expect(PublicUrl.from(value)).toBeNull();
        }
    );

    it("drops trailing slashes, query and hash", () => {
        const url = PublicUrl.from(" https://api.example.com//?a=1#x ");

        expect(url?.toString()).toBe("https://api.example.com");
    });

    it("keeps a path prefix", () => {
        const url = PublicUrl.from("http://localhost:3001/api/");

        expect(url?.toString()).toBe("http://localhost:3001/api");
        expect(url?.host).toBe("localhost:3001");
    });

    it("joins paths with exactly one slash", () => {
        expect(PublicUrl.from("https://api.example.com/")?.join("/files/")).toBe(
            "https://api.example.com/files/"
        );
        expect(PublicUrl.from("http://localhost:3001/api")?.join("files")).toBe(
            "http://localhost:3001/api/files"
        );
    });
});
