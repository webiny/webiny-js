export declare const SCHEDULER_PERMISSIONS_SCHEMA: {
    readonly prefix: "scheduler";
    readonly fullAccess: true;
    readonly entities: readonly [{
        readonly id: "action";
        readonly permission: "scheduler.action";
        readonly scopes: readonly ["full", "own"];
    }];
};
