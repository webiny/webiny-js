import { ApiBeforeWatch, UiService } from "~/abstractions/index.js";
import { showConfigChangeNotice } from "./showConfigChangeNotice.js";

class ShowConfigChangeInfoBeforeApiWatchImpl implements ApiBeforeWatch.Interface {
    constructor(private ui: UiService.Interface) {}

    async execute() {
        showConfigChangeNotice(this.ui);
    }
}

export const ShowConfigChangeInfoBeforeApiWatch = ApiBeforeWatch.createImplementation({
    implementation: ShowConfigChangeInfoBeforeApiWatchImpl,
    dependencies: [UiService]
});
