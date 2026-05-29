import { makeAutoObservable, runInAction } from "mobx";
import {
    NextjsConfigPresenter as PresenterAbstraction,
    NextjsConfigRepository,
    StarterKitFramework
} from "./abstractions.js";

class NextjsConfigPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;
    private selectedFramework: StarterKitFramework = "nextjs";

    constructor(private repository: NextjsConfigRepository.Interface) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            config: this.repository.getConfig(this.selectedFramework),
            framework: this.selectedFramework
        };
    }

    init(): void {
        this.loadForFramework(this.selectedFramework);
    }

    setFramework(framework: StarterKitFramework): void {
        this.selectedFramework = framework;
        this.loadForFramework(framework);
    }

    private loadForFramework(framework: StarterKitFramework): void {
        if (this.repository.getConfig(framework)) {
            return;
        }
        this.loading = true;
        this.repository.loadConfig(framework).then(() => {
            runInAction(() => {
                this.loading = false;
            });
        });
    }
}

export const NextjsConfigPresenter = PresenterAbstraction.createImplementation({
    implementation: NextjsConfigPresenterImpl,
    dependencies: [NextjsConfigRepository]
});
