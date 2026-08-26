interface Track {
    count: number;
    params: any;
}

interface Trackers {
    [key: string]: Track;
}

export class LifecycleEventTracker {
    private _tracked: Trackers = {};

    public track(name: string, params: any): void {
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

    public getLast(name: string): Track | null {
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

    public isExecuted(name: string): boolean {
        return !!this._tracked[name];
    }

    public getExecuted(name: string): number {
        if (!this._tracked[name]) {
            return 0;
        }
        return this._tracked[name].count;
    }
}
