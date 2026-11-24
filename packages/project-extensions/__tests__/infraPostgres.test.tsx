import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { AuroraPostgres } from "@webiny/project-extensions-aws/extensions/index.js";
import { Postgres as StandalonePostgres } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Infra } from "~/namespaces/infra.js";

/* Calls the namespace member as a function, the way React would render it. */
const render = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    return (Component as unknown as (props: Record<string, unknown>) => React.ReactElement)(props);
};

const standaloneProps = {
    host: "localhost",
    port: 5432,
    user: "webiny",
    password: "webiny",
    database: "webiny"
};

/*
 * Type-level: each component takes only its own props. `tsc` checks this file, so a prop that
 * leaked from one to the other would fail the build.
 */
export const typeChecks = [
    <Infra.Postgres key="standalone" {...standaloneProps} ssl={{ rejectUnauthorized: false }} />,
    <Infra.AuroraPostgres key="aws-defaults" />,
    <Infra.AuroraPostgres key="aws" minCapacity={0.5} maxCapacity={8} readers={1} rdsProxy />,
    // @ts-expect-error `Infra.Postgres` is standalone only: it has no Aurora capacity.
    <Infra.Postgres key="standalone-capacity" {...standaloneProps} minCapacity={1} />,
    // @ts-expect-error `Infra.Postgres` needs the connection props.
    <Infra.Postgres key="standalone-incomplete" />,
    // @ts-expect-error The standalone props stay complete: `port` must be a number.
    <Infra.Postgres key="wrong-port" {...standaloneProps} port="5432" />,
    // @ts-expect-error `Infra.AuroraPostgres` connects to the cluster it creates: no `host`.
    <Infra.AuroraPostgres key="aws-host" host="localhost" />,
    // @ts-expect-error `poolSize` is internal.
    <Infra.AuroraPostgres key="aws-pool" poolSize={4} />,
    // @ts-expect-error `readers` is a number.
    <Infra.AuroraPostgres key="wrong-readers" readers="two" />
];

describe("Infra.Postgres and Infra.AuroraPostgres", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

    afterEach(() => {
        if (originalHostingType === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = originalHostingType;
        }
    });

    it("Infra.Postgres is the standalone component", () => {
        expect(Infra.Postgres).toBe(StandalonePostgres);
    });

    it("Infra.AuroraPostgres is the AWS component, at the top level only", () => {
        expect(Infra.AuroraPostgres).toBe(AuroraPostgres);
        expect(Object.values(Infra.Core)).not.toContain(AuroraPostgres);
    });

    it("refuses Infra.Postgres in an AWS project", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";

        expect(() => render(Infra.Postgres, standaloneProps)).toThrow(
            `"Infra/Postgres" is only available in standalone projects. This project's hosting type is "aws".`
        );
    });

    it("refuses Infra.AuroraPostgres in a standalone project", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";

        expect(() => render(Infra.AuroraPostgres, {})).toThrow(
            `"Infra/AuroraPostgres" is only available in AWS projects. This project's hosting type is "standalone".`
        );
    });

    it("has no RdsProxy: the proxy is the rdsProxy prop of Infra.AuroraPostgres", () => {
        expect(Infra).not.toHaveProperty("RdsProxy");
        expect(Infra.Core).not.toHaveProperty("RdsProxy");
    });
});
