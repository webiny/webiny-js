import { createFeature } from "@webiny/feature/admin";
import { FileDetailsPresenter as Abstraction } from "./abstractions.js";
import { FileDetailsPresenter } from "./FileDetailsPresenter.js";

export const FileDetailsPresenterFeature = createFeature({
    name: "FileManager/FileDetailsPresenter",
    register(container) {
        container.register(FileDetailsPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
