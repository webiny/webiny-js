import { createFeature } from "@webiny/feature/admin";
import { FileListPresenter as Abstraction } from "./abstractions.js";
import { FileListPresenter } from "./FileListPresenter.js";

export const FileListPresenterFeature = createFeature({
    name: "FileManager/FileListPresenter",
    register(container) {
        container.register(FileListPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
