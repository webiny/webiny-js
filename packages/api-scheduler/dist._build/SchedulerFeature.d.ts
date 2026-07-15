import { type Container } from "@webiny/feature/api";
export type { ISchedulerFeatureConfig } from "./SchedulerFeature.types.js";
export declare const SchedulerFeature: {
    name: string;
    register(container: Container): void;
};
