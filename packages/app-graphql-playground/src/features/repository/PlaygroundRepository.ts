import { LocalStorage } from "@webiny/app/features/localStorage/abstractions.js";
import { PlaygroundRepository } from "./abstractions.js";

const STORAGE_KEY = "graphql-playground";

class PlaygroundRepositoryImpl implements PlaygroundRepository.Interface {
    private readonly localStorage: LocalStorage.Interface;

    constructor(localStorage: LocalStorage.Interface) {
        this.localStorage = localStorage;
    }

    public load(): PlaygroundRepository.PersistedState | null {
        try {
            const state = this.localStorage.get<PlaygroundRepository.PersistedState>(STORAGE_KEY);
            if (!state) {
                return null;
            }

            return state;
        } catch {
            /* Corrupt or unreadable state must never break the playground. */
            return null;
        }
    }

    public save(state: PlaygroundRepository.PersistedState): void {
        this.localStorage.set(STORAGE_KEY, state);
    }
}

export const DefaultPlaygroundRepository = PlaygroundRepository.createImplementation({
    implementation: PlaygroundRepositoryImpl,
    dependencies: [LocalStorage]
});
