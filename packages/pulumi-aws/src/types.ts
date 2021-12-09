import { Input } from "@pulumi/pulumi";

export type PulumiInputValue<T extends Input<any>> = T extends Input<infer TValue> ? TValue : never;
