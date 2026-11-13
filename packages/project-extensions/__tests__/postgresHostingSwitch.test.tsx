import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Postgres as AwsPostgres } from "@webiny/project-extensions-aws/extensions/index.js";
import { RdsProxy } from "@webiny/project-extensions-aws/extensions/index.js";
import { Postgres as StandalonePostgres } from "@webiny/project-extensions-standalone/extensions/index.js";
import { Infra } from "~/namespaces/infra.js";

/*
 * Calls the namespace member as a function: the returned element shows which hosting type's
 * version it renders.
 */
const renderedComponent = (Component: React.ComponentType<any>, props: Record<string, unknown>) => {
    const render = Component as unknown as (props: Record<string, unknown>) => React.ReactElement;
    const element = render(props);
    return element.type;
};

const standaloneProps = {
    host: "localhost",
    port: 5432,
    user: "webiny",
    password: "webiny",
    database: "webiny"
};

/*
 * Type-level: each hosting type's props type-check on `Infra.Postgres`. `tsc` checks this file, so
 * a switch that only accepted one prop set would fail the build.
 */
export const typeChecks = [
    <Infra.Postgres key="aws-defaults" />,
    <Infra.Postgres key="aws" minCapacity={0.5} maxCapacity={8} readers={1} />,
    <Infra.Postgres key="standalone" {...standaloneProps} ssl={{ rejectUnauthorized: false }} />,
    <Infra.RdsProxy key="proxy" enabled />,
    // @ts-expect-error A wrong type fails in both prop sets, so the props are not `any`.
    <Infra.Postgres key="wrong-readers" readers="two" />,
    // @ts-expect-error The standalone props stay complete: `port` must be a number.
    <Infra.Postgres key="wrong-port" {...standaloneProps} port="5432" />
];

describe("Infra.Postgres per hosting type", () => {
    const originalHostingType = process.env.WEBINY_HOSTING_TYPE;

    afterEach(() => {
        if (originalHostingType === undefined) {
            delete process.env.WEBINY_HOSTING_TYPE;
        } else {
            process.env.WEBINY_HOSTING_TYPE = originalHostingType;
        }
    });

    it("renders the AWS version in an AWS project", () => {
        process.env.WEBINY_HOSTING_TYPE = "aws";

        expect(renderedComponent(Infra.Postgres, { readers: 1 })).toBe(AwsPostgres);
    });

    it("renders the standalone version in a standalone project", () => {
        process.env.WEBINY_HOSTING_TYPE = "standalone";

        expect(renderedComponent(Infra.Postgres, standaloneProps)).toBe(StandalonePostgres);
    });

    it("renders the standalone version when the hosting type isn't set, as before", () => {
        delete process.env.WEBINY_HOSTING_TYPE;

        expect(renderedComponent(Infra.Postgres, standaloneProps)).toBe(StandalonePostgres);
    });

    it("exposes Infra.RdsProxy", () => {
        expect(Infra.RdsProxy).toBe(RdsProxy);
    });
});
