import { Container } from "@webiny/di";
import { describe, expect, it } from "vitest";
import { WcpContext } from "~/features/wcp/WcpContext/index.js";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { License } from "@webiny/wcp";

describe("context", () => {
    it("should create wcp on the context", async () => {
        const container = new Container();
        const testProjectLicense = createTestWcpLicense();

        const license = License.fromLicenseDto(testProjectLicense);

        BuildParamsFeature.register(container, license);
        FeatureFlagsFeature.register(container, license);
        WcpFeature.register(container, license);

        const wcpContext = container.resolve(WcpContext);
        expect(wcpContext.getProject()).toMatchObject(testProjectLicense);
    });
});
