import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderExtensions } from "@webiny/project/services/GetProjectConfigService/renderExtensions.js";
import type { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { DatabaseSetup } from "@webiny/project/extensions/index.js";
// The specs the shared `Infra` namespace exposes; registering the implementations makes them render
// this package's components.
import { Postgres } from "@webiny/project-extensions-aws/extensions/Postgres.js";
import { RdsProxy } from "@webiny/project-extensions-aws/extensions/RdsProxy.js";
import "~/extensions/registerExtensionImplementations.js";

const sdkParams = { env: "dev" } as unknown as ProjectSdkParamsService.Params;

/* Renders a config the way `getProjectConfig` does, and returns the collected properties. */
const renderConfig = async (children: React.ReactNode) => {
    const Extensions = () => (
        <>
            {/* What `ProjectAws` renders before the project's own config. */}
            <DatabaseSetup setupName="ddb" />
            {children}
        </>
    );
    return (await renderExtensions({ Extensions, sdkParams })) as Record<string, any>;
};

const asArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

const coreBeforeDeployHooks = (config: Record<string, any>) =>
    asArray(config["Core/BeforeDeploy"]).map((hook: { src: string }) => hook.src.split("/").pop());

describe("Infra.Postgres and Infra.RdsProxy in an AWS project", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

    beforeEach(() => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
    });

    afterEach(() => {
        if (originalHostingType === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = originalHostingType;
        }
    });

    it("sets the database setup to pg, and adds the core deploy checks", async () => {
        const config = await renderConfig(<Postgres minCapacity={1} readers={2} />);

        expect(config["Project/DatabaseSetup"]).toEqual({ setupName: "pg" });
        expect(config["Infra/Postgres"]).toEqual({ minCapacity: 1, readers: 2 });
        expect(coreBeforeDeployHooks(config)).toEqual(["ValidatePostgresBeforeCoreDeploy.js"]);
    });

    it("leaves the database setup alone without <Postgres />", async () => {
        const config = await renderConfig(null);

        expect(config["Project/DatabaseSetup"]).toEqual({ setupName: "ddb" });
    });

    it("adds the proxy's deploy check only when the proxy is enabled", async () => {
        const enabled = await renderConfig(<RdsProxy enabled />);
        const disabled = await renderConfig(<RdsProxy enabled={false} />);

        expect(enabled["Infra/RdsProxy"]).toEqual({ enabled: true });
        expect(coreBeforeDeployHooks(enabled)).toEqual(["EnsurePostgresWithRdsProxy.js"]);
        expect(coreBeforeDeployHooks(disabled)).toEqual([]);
    });
});
