import React from "react";
import { describe, expect, it } from "vitest";
import { renderExtensions } from "@webiny/project/services/GetProjectConfigService/renderExtensions.js";
import type { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { HeadlessCmsPg } from "~/project.js";

const sdkParams = { env: "dev" } as unknown as ProjectSdkParamsService.Params;

const renderConfig = async (children: React.ReactNode) => {
    const Extensions = () => <>{children}</>;
    return (await renderExtensions({ Extensions, sdkParams })) as Record<string, any>;
};

const asArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

describe("<HeadlessCmsPg />", () => {
    it("adds the CMS storage and no build param without settings", async () => {
        const config = await renderConfig(<HeadlessCmsPg />);

        expect(asArray(config["Api/Extension"]).map(ext => ext.exportName)).toEqual([
            "HeadlessCmsPgExtension"
        ]);
        expect(asArray(config["Api/BuildParam"])).toEqual([]);
    });

    it("puts only the settings it is given in the build param", async () => {
        const config = await renderConfig(<HeadlessCmsPg indexMode="lean" countCap={500} />);

        expect(asArray(config["Api/BuildParam"])).toEqual([
            { paramName: "HeadlessCmsPg", value: { defaultIndexMode: "lean", countCap: 500 } }
        ]);
    });
});
