import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { PublicUrls } from "../index.js";
import { PublicUrlsFeature } from "../index.js";

describe("PublicUrls", () => {
    it("returns unknown URLs by default", async () => {
        const container = new Container();
        PublicUrlsFeature.register(container);

        const publicUrls = container.resolve(PublicUrls);

        expect((await publicUrls.getApiUrl()).isKnown()).toBe(false);
        expect((await publicUrls.getAdminUrl()).isKnown()).toBe(false);
    });
});
