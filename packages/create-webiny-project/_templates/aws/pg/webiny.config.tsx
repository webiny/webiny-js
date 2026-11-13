import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
import { HeadlessCmsPg } from "@webiny/api-headless-cms-pg/project";
import { AcoPg } from "@webiny/api-aco-pg/project";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />

            {/* Postgres runs inside a VPC: the core app creates the VPC (with NAT gateways) and an
                Aurora PostgreSQL Serverless v2 database in it, and every API function joins it. */}
            <Infra.Vpc enabled={true} />
            <Infra.Postgres />
            {/* Put an RDS Proxy in front of the database, to pool the API functions' connections. */}
            {/* <Infra.Core.RdsProxy enabled={true} /> */}

            {/* Content on Postgres: the CMS storage, and folder-level permissions in a folder catalog. */}
            <HeadlessCmsPg />
            <AcoPg />

            {/* Encryption MUST always be configured for production environments. */}
            <Infra.Env.IsProd>
                <Infra.Crypto.Encryption
                    passphrase={process.env.WEBINY_ENCRYPTION_PASSPHRASE || ""}
                />
            </Infra.Env.IsProd>
            <Cognito />
        </>
    );
};
