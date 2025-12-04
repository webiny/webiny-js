import { makeAutoObservable, runInAction } from "mobx";

export class SelectabilityRepository {
    cache = new Map<string, boolean>();

    constructor() {
        makeAutoObservable(this);
    }

    get(id: string): boolean {
        // If not in cache - it's selectable
        return this.cache.get(id) ?? true;
    }

    async getSelectabilityRules(ids: string[]) {
        // TODO: call gateway to load data from API
        const rules = await new Promise<Array<[string, boolean]>>(resolve => {
            setTimeout(() => {
                resolve(ids.map(id => [id, false]));
            }, 2000);
        });

        runInAction(() => {
            rules.forEach(([id, value]) => {
                this.cache.set(id, value);
            });
        });
    }
}
