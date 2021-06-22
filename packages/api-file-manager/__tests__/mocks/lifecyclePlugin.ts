import { FilePlugin } from "~/plugins/definitions";

class LifecycleEventTracker {
    private _tracked: Record<string, { count: number; params: any }> = {};

    public track(name: string, params: Record<string, any>): void {
        if (!this._tracked[name]) {
            this._tracked[name] = {
                count: 0,
                params: []
            };
        }
        this._tracked[name] = {
            count: this._tracked[name].count + 1,
            params: this._tracked[name].params.concat([params])
        };
    }

    public getLast(name: string): { count: number; params: any } {
        return this._tracked[name] || null;
    }

    public reset(): void {
        this._tracked = {};
    }

    public isExecutedOnce(name: string): boolean {
        if (!this._tracked[name]) {
            return false;
        }
        return this._tracked[name].count === 1;
    }

    public getExecuted(name: string): number {
        if (!this._tracked[name]) {
            return 0;
        }
        return this._tracked[name].count;
    }
}

export const lifecycleEventTracker = new LifecycleEventTracker();

export const fileLifecyclePlugin = new FilePlugin({
    beforeCreate: async params => {
        lifecycleEventTracker.track("file:beforeCreate", params);
    },
    afterCreate: async params => {
        lifecycleEventTracker.track("file:afterCreate", params);
    },
    beforeUpdate: async params => {
        lifecycleEventTracker.track("file:beforeUpdate", params);
    },
    afterUpdate: async params => {
        lifecycleEventTracker.track("file:afterUpdate", params);
    },
    beforeBatchCreate: async params => {
        lifecycleEventTracker.track("file:beforeBatchCreate", params);
    },
    afterBatchCreate: async params => {
        lifecycleEventTracker.track("file:afterBatchCreate", params);
    },
    beforeDelete: async params => {
        lifecycleEventTracker.track("file:beforeDelete", params);
    },
    afterDelete: async params => {
        lifecycleEventTracker.track("file:afterDelete", params);
    }
});
