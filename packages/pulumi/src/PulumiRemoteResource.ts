import * as pulumi from "@pulumi/pulumi";

export interface PulumiRemoteResource<T> {
    name: string;
    readonly output: pulumi.Output<pulumi.Unwrap<T>>;
}
