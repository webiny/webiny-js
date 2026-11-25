import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderExtensions } from "@webiny/project/services/GetProjectConfigService/renderExtensions.js";
import type { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { registerExtensionImplementation } from "@webiny/project/extensions/hosting/index.js";
import { HeadlessCmsPg } from "@webiny/api-headless-cms-pg/project.js";
import { AcoPg } from "@webiny/api-aco-pg/project.js";
import { AuroraPostgres } from "~/extensions/AuroraPostgres.js";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import {
    AuroraPostgresCluster,
    auroraPostgresClusterParamsSchema
} from "~/extensions/AuroraPostgresCluster.js";

const sdkParams = { env: "dev" } as unknown as ProjectSdkParamsService.Params;

const renderConfig = async (children: React.ReactNode) => {
    const Extensions = () => <>{children}</>;
    return (await renderExtensions({ Extensions, sdkParams })) as Record<string, any>;
};

const asArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

/* The api extensions' files, each once: the api build imports a file once however often it's added. */
const apiExtensionFiles = (config: Record<string, any>) => [
    ...new Set(asArray(config["Api/Extension"]).map((ext: { src: string }) => ext.src))
];

const buildParams = (config: Record<string, any>) => asArray(config["Api/BuildParam"]);

/*
 * `@webiny/project-aws` registers the cluster's implementation, which renders the database setup
 * and the Pulumi hooks. Here a stand-in records only the cluster's params.
 */
const ClusterParamsOnly = defineExtension({
    type: "Infra/AuroraPostgresCluster",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Records the cluster's params.",
    paramsSchema: auroraPostgresClusterParamsSchema,
    render: () => null
});

describe("<Infra.AuroraPostgres />", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;
    let unregister: () => void;

    beforeEach(() => {
        process.env.WEBINY_HOSTING_TYPE = "aws";
        unregister = registerExtensionImplementation(
            "aws",
            AuroraPostgresCluster,
            ClusterParamsOnly
        );
    });

    afterEach(() => {
        unregister();
        if (originalHostingType === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = originalHostingType;
        }
    });

    it("renders the cluster with the settings it is given, the CMS storage and the ACO catalog", async () => {
        const config = await renderConfig(<AuroraPostgres maxCapacity={8} rdsProxy />);

        expect(config["Infra/AuroraPostgres"]).toEqual({ maxCapacity: 8, rdsProxy: true });
        expect(config["Infra/AuroraPostgresCluster"]).toEqual({ maxCapacity: 8, rdsProxy: true });
        expect(config["Project/HeadlessCmsPg"]).toEqual({});
        expect(config["Project/AcoPg"]).toEqual({});
        expect(apiExtensionFiles(config).map(src => src.split("/").pop())).toEqual([
            "HeadlessCmsPgExtension.js",
            "AcoPgExtension.js"
        ]);
    });

    it("sets the CMS defaults for the proxy only with rdsProxy", async () => {
        const withProxy = await renderConfig(<AuroraPostgres rdsProxy />);
        const withoutProxy = await renderConfig(<AuroraPostgres />);

        expect(buildParams(withProxy)).toEqual([
            { paramName: "HeadlessCmsPgDefaults", value: { bitmapHints: false } }
        ]);
        expect(buildParams(withoutProxy)).toEqual([]);
    });

    describe("next to the project's own <HeadlessCmsPg /> and <AcoPg />", () => {
        const expectOneOfEach = (config: Record<string, any>) => {
            expect(apiExtensionFiles(config).map(src => src.split("/").pop())).toEqual([
                "HeadlessCmsPgExtension.js",
                "AcoPgExtension.js"
            ]);
            expect(config["Project/HeadlessCmsPg"]).toEqual({ indexMode: "lean" });
            expect(buildParams(config)).toEqual([
                { paramName: "HeadlessCmsPg", value: { defaultIndexMode: "lean" } }
            ]);
        };

        it("gives one of each, with the project's settings, when they come after it", async () => {
            const config = await renderConfig(
                <>
                    <AuroraPostgres />
                    <HeadlessCmsPg indexMode="lean" />
                    <AcoPg />
                </>
            );

            expectOneOfEach(config);
        });

        it("gives one of each, with the project's settings, when they come before it", async () => {
            const config = await renderConfig(
                <>
                    <HeadlessCmsPg indexMode="lean" />
                    <AcoPg />
                    <AuroraPostgres />
                </>
            );

            expectOneOfEach(config);
        });

        it("keeps an explicit bitmapHints next to the proxy's default, which it wins over", async () => {
            const config = await renderConfig(
                <>
                    <AuroraPostgres rdsProxy />
                    <HeadlessCmsPg bitmapHints />
                </>
            );

            // `PgStorageConfig` reads `HeadlessCmsPg` over `HeadlessCmsPgDefaults`.
            expect(buildParams(config)).toEqual([
                { paramName: "HeadlessCmsPgDefaults", value: { bitmapHints: false } },
                { paramName: "HeadlessCmsPg", value: { bitmapHints: true } }
            ]);
        });
    });
});
