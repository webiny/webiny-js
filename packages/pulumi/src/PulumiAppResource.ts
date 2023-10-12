import * as pulumi from "@pulumi/pulumi";

export interface PulumiAppResourceConstructor<T = any, TArgs = any> {
    new (name: string, args: TArgs, opts?: pulumi.CustomResourceOptions): T;
}

export type PulumiAppResourceType<T extends PulumiAppResourceConstructor> =
    T extends PulumiAppResourceConstructor<infer TType> ? TType : never;

export type PulumiAppResourceArgs<T extends PulumiAppResourceConstructor> =
    T extends PulumiAppResourceConstructor<any, infer TArgs> ? Exclude<TArgs, undefined> : never;

export interface CreatePulumiAppResourceParams<TConstructor extends PulumiAppResourceConstructor> {
    name: string;
    config: PulumiAppResourceArgs<TConstructor>;
    opts?: pulumi.CustomResourceOptions;
    meta?: Record<string, any>;
}

export interface PulumiAppResourceConfigModifier<T> {
    (value: pulumi.Unwrap<T>): T | void;
}

export interface PulumiAppResourceConfigSetter<T> {
    (value: T): void;
    (fcn: PulumiAppResourceConfigModifier<T>): void;
}

export type PulumiAppResourceConfigProxy<T extends object> = {
    readonly [K in keyof T]-?: PulumiAppResourceConfigSetter<T[K]>;
} & {
    clone(): T;
};

export interface PulumiAppResource<T extends PulumiAppResourceConstructor> {
    name: string;
    type: T;
    readonly config: PulumiAppResourceConfigProxy<PulumiAppResourceArgs<T>>;
    readonly opts: pulumi.CustomResourceOptions;
    readonly meta: Record<string, any>;
    readonly output: pulumi.Output<pulumi.Unwrap<PulumiAppResourceType<T>>>;
}
