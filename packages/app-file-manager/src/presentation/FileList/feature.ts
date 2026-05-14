import { createFeature } from "@webiny/feature/admin";
import { FileManagerPresenter as Abstraction } from "./abstractions.js";
import { FileManagerPresenter } from "./FileManagerPresenter.js";

export const FileManagerPresenterFeature = createFeature({
    name: "FileManager/FileManagerPresenter",
    register(container) {
        container.register(FileManagerPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
