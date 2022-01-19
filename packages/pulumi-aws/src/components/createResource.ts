import * as pulumi from "@pulumi/pulumi";

interface ResourceConstructor<T = any, TArgs = any> {
    new (name: string, args?: TArgs, opts?: pulumi.CustomResourceOptions): T;
}

export type ResourceType<T extends ResourceConstructor> = T extends ResourceConstructor<infer TType>
    ? TType
    : never;

export type ResourceArgs<T extends ResourceConstructor> = T extends ResourceConstructor<
    any,
    infer TArgs
>
    ? TArgs
    : never;

export interface ResourceOverride<TCtor extends ResourceConstructor> {
    (args: ResourceArgs<TCtor>): void;
}

export function createResource<TCtor extends ResourceConstructor>(
    ctor: TCtor,
    name: string,
    override: ResourceOverride<TCtor> | undefined,
    args: ResourceArgs<TCtor>,
    opts?: pulumi.CustomResourceOptions
) {
    override?.(args);
    return new ctor(name, args, opts);
}
