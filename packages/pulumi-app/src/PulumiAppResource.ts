import * as pulumi from "@pulumi/pulumi";

export interface ResourceConstructor<T = any, TArgs = any> {
    new (name: string, args: TArgs, opts?: pulumi.CustomResourceOptions): T;
}

export type ResourceType<T extends ResourceConstructor> = T extends ResourceConstructor<infer TType>
    ? TType
    : never;

export type ResourceArgs<T extends ResourceConstructor> = T extends ResourceConstructor<
    any,
    infer TArgs
>
    ? Exclude<TArgs, undefined>
    : never;

export interface ResourceOverride<TCtor extends ResourceConstructor> {
    (args: ResourceArgs<TCtor>): void;
}

export interface PulumiAppResourceParams<T extends ResourceConstructor> {
    name: string;
    config: ResourceArgs<T>;
    opts?: pulumi.CustomResourceOptions;
    output: pulumi.Output<pulumi.Unwrap<ResourceType<T>>>;
}

export class PulumiAppResource<T extends ResourceConstructor> {
    public readonly output: pulumi.Output<pulumi.Unwrap<ResourceType<T>>>;
    public config: ResourceArgs<T>;
    public opts: pulumi.CustomResourceOptions;

    public readonly create: () => void;

    constructor(ctor: T, params: PulumiAppResourceParams<T>) {
        this.config = params.config;
        this.opts = params.opts ?? {};

        let resolve: (res: ResourceType<T>) => void;
        let created = false;

        this.create = () => {
            if (created) {
                // prevent double initialization
                return;
            }

            const resource = new ctor(params.name, this.config, this.opts);
            resolve(resource);
            created = false;
        };

        const promise = new Promise<ResourceType<T>>(r => {
            resolve = r;
        });

        this.output = pulumi.output(promise);
    }
}
