import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuroraPostgres } from "@webiny/project-extensions-aws/extensions/index.js";
import { getPostgresConfigFromExtension } from "~/pulumi/apps/extensions/getPostgresConfigFromExtension.js";
import { renderAwsConfig, toProjectConfig, useHostingType } from "./renderAwsConfig.js";

const asArray = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []);

const fileNames = (config: Record<string, any>, type: string) =>
    asArray(config[type]).map((hook: { src: string }) => hook.src.split("/").pop());

describe("<Infra.AuroraPostgres /> in an AWS project", () => {
    let restoreHostingType: () => void;

    beforeEach(() => {
        restoreHostingType = useHostingType("aws");
    });

    afterEach(() => {
        restoreHostingType();
    });

    it("sets the database setup to pg, and adds the core deploy checks and the database", async () => {
        const config = await renderAwsConfig(<AuroraPostgres minCapacity={1} readers={2} />);

        expect(config["Project/DatabaseSetup"]).toEqual({ setupName: "pg" });
        expect(config["Infra/AuroraPostgres"]).toEqual({ minCapacity: 1, readers: 2 });
        expect(config["Infra/AuroraPostgresCluster"]).toEqual({ minCapacity: 1, readers: 2 });
        expect(fileNames(config, "Core/BeforeDeploy")).toEqual([
            "ValidatePostgresBeforeCoreDeploy.js"
        ]);
        expect(fileNames(config, "Core/Pulumi")).toEqual(["AddCorePostgres.js"]);
    });

    it("builds the api with the Postgres handlers, and knex + pg in the bundle", async () => {
        const config = await renderAwsConfig(<AuroraPostgres />);

        expect(fileNames(config, "Project/Decorator")).toEqual(["ReplaceApiLambdaFnHandlers.js"]);
        expect(fileNames(config, "Api/AfterBuild")).toEqual(["CopyPgModulesAfterApiBuild.js"]);
        // The Postgres versions, not the OpenSearch ones of the same name.
        expect(asArray(config["Project/Decorator"])[0].src).toContain("/Postgres/");
    });

    it("adds the Postgres CMS storage and the ACO folder catalog to the api", async () => {
        const config = await renderAwsConfig(<AuroraPostgres />);

        expect(fileNames(config, "Api/Extension")).toEqual([
            "HeadlessCmsPgExtension.js",
            "AcoPgExtension.js"
        ]);
        expect(asArray(config["Api/BuildParam"])).toEqual([]);
    });

    it("leaves the database setup and the api build alone without it", async () => {
        const config = await renderAwsConfig(null);

        expect(config["Project/DatabaseSetup"]).toEqual({ setupName: "ddb" });
        expect(fileNames(config, "Project/Decorator")).toEqual([]);
        expect(fileNames(config, "Api/AfterBuild")).toEqual([]);
        expect(fileNames(config, "Api/Extension")).toEqual([]);
    });

    it("gives the core app its settings, with the defaults and the proxy switch", async () => {
        const defaults = await renderAwsConfig(<AuroraPostgres />);
        const custom = await renderAwsConfig(
            <AuroraPostgres minCapacity={2} maxCapacity={32} readers={1} rdsProxy />
        );
        const none = await renderAwsConfig(null);

        expect(getPostgresConfigFromExtension(toProjectConfig(defaults))).toEqual({
            minCapacity: 0.5,
            maxCapacity: 16,
            readers: 0,
            poolSize: 16,
            rdsProxy: false
        });
        expect(getPostgresConfigFromExtension(toProjectConfig(custom))).toEqual({
            minCapacity: 2,
            maxCapacity: 32,
            readers: 1,
            poolSize: 16,
            rdsProxy: true
        });
        expect(getPostgresConfigFromExtension(toProjectConfig(none))).toBeUndefined();
    });

    it("turns bitmap hints off by default through a build param, only with the proxy", async () => {
        const withProxy = await renderAwsConfig(<AuroraPostgres rdsProxy />);
        const withoutProxy = await renderAwsConfig(<AuroraPostgres rdsProxy={false} />);

        expect(asArray(withProxy["Api/BuildParam"])).toEqual([
            { paramName: "HeadlessCmsPgDefaults", value: { bitmapHints: false } }
        ]);
        expect(asArray(withoutProxy["Api/BuildParam"])).toEqual([]);
    });
});
