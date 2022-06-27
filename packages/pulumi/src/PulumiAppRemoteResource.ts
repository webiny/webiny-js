import * as pulumi from "@pulumi/pulumi";

export interface PulumiAppRemoteResource<T> {
    name: string;
    readonly output: pulumi.Output<pulumi.Unwrap<T>>;
}
