import { makeAutoObservable } from "mobx";
import { DebugSessionsRepository } from "~/features/debugger/index.js";
import { DebuggerPresenter as Abstraction } from "./abstractions.js";
import { downloadJson } from "./downloadJson.js";

class DebuggerPresenterImpl implements Abstraction.Interface {
    constructor(private repository: DebugSessionsRepository.Interface) {
        makeAutoObservable<DebuggerPresenterImpl, "repository">(
            this,
            { repository: false },
            { autoBind: true }
        );
    }

    get vm(): Abstraction.ViewModel {
        return {
            available: this.repository.canCapture(),
            captureOn: this.repository.isCaptureOn(),
            sessionCount: this.repository.getSessions().length,
            entryCount: this.repository.getEntryCount()
        };
    }

    setCaptureOn(enabled: boolean): void {
        this.repository.setCaptureOn(enabled);
    }

    clear(): void {
        this.repository.clear();
    }

    downloadReport(): void {
        const generatedAt = new Date().toISOString();
        const report = {
            generatedAt,
            sessions: this.repository.getSessions()
        };
        downloadJson(`webiny-debug-${generatedAt}.json`, report);
    }
}

export const DebuggerPresenter = Abstraction.createImplementation({
    implementation: DebuggerPresenterImpl,
    dependencies: [DebugSessionsRepository]
});
