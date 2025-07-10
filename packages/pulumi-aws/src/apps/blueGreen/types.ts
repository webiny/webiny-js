import type { IStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils/index.js";

export type GenericRecord<K extends PropertyKey = PropertyKey, V = any> = Record<K, V>;

export type NonEmptyArray<T> = [T, ...T[]];

export interface IDeploymentDomain {
    /**
     * A name of the deployment (e.g. "green" or "blue").
     */
    name: string;
    env: string;
    variant: string | undefined;
    domains: {
        api: string;
        admin: string;
        website: string | undefined;
        preview: string | undefined;
    };
}

export type IDeploymentsDomains = [IDeploymentDomain, IDeploymentDomain];

export interface IBlueGreenDeployment {
    /**
     * Name by this deployment will be accessible in the Pulumi program.
     */
    name: string;
    env: string;
    variant: string | undefined;
}

export interface IAttachedDomainsTypes {
    api: NonEmptyArray<string>;
    admin: NonEmptyArray<string>;
    website: NonEmptyArray<string> | undefined;
    preview: NonEmptyArray<string> | undefined;
}

export interface IAttachedDomains {
    acmCertificateArn: string;
    sslSupportMethod?: string;
    /**
     * We need to allow system to be deployed without any domains for start.
     * User can attach domains later.
     */
    domains?: IAttachedDomainsTypes;
}

export interface IAttachDomainsCallableParams {
    env: string;
}

export interface IAttachDomainsCallable {
    (params: IAttachDomainsCallableParams): IAttachedDomains;
}

export type IAttachedDomainKey = keyof IAttachedDomainsTypes;

export interface IResolvedDomain {
    /**
     * Environment and variant of the deployment.
     */
    env: string;
    variant: string | undefined;
    /**
     * Name of the deployment (e.g. "green" or "blue").
     */
    name: string;
    /**
     * Type of the domain (e.g. "api", "admin", "website", "preview").
     */
    type: IAttachedDomainKey;
    /**
     * List of domains that will be used as source and transferred to the target domain.
     */
    sources: NonEmptyArray<string>;
    /**
     * The target CloudFront domain of the deployment.
     */
    target: string;
}

export type IResolvedDomains = IResolvedDomain[];

export interface IBlueGreenStackOutput extends IStackOutput {
    distributionDomain: string;
    distributionUrl: string;
    /**
     * TODO fix later
     */
    // @ts-expect-error
    environments?: IResolvedDomains;
    domains?: string[];
}
