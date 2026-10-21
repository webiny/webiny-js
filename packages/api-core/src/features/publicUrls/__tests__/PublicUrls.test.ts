import { describe, it, expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { PublicUrls, PublicUrlsFeature } from "../index.js";

describe("PublicUrls", () => {
    it("returns unknown URLs by default", async () => {
        const container = new Container();
        PublicUrlsFeature.register(container);

        const publicUrls = container.resolve(PublicUrls);

        expect((await publicUrls.getApiUrl()).isKnown()).toBe(false);
        expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
    });
});
