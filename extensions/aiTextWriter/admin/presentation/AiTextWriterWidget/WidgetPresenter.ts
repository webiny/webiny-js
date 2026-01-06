import { makeAutoObservable, runInAction } from "mobx";
import { AiPrompt } from "../../features/aiPrompt/abstractions.js";

export class WidgetPresenter {
    private title = "AI Text Writer";
    private message = "Write some text with the help of the AI Writing assistant.";
    private loading = false;

    constructor(private aiPrompt: AiPrompt.Interface) {
        makeAutoObservable(this);
    }

    get vm() {
        // View Model
        return {
            loading: this.loading,
            title: this.title,
            message: this.message
        };
    }

    async loadData() {
        this.loading = true;
        const response = await this.aiPrompt.prompt([
            {
                role: "user",
                content: "whatever"
            }
        ]);

        runInAction(() => {
            this.loading = false;
            this.message = response;
        });
    }
}
