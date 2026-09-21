import { AdminBeforeWatch, UiService } from "~/abstractions/index.js";
import { showConfigChangeNotice } from "./showConfigChangeNotice.js";

class ShowConfigChangeInfoBeforeAdminWatchImpl implements AdminBeforeWatch.Interface {
    constructor(private ui: UiService.Interface) {}

    async execute() {
        showConfigChangeNotice(this.ui);
    }
}

export const ShowConfigChangeInfoBeforeAdminWatch = AdminBeforeWatch.createImplementation({
    implementation: ShowConfigChangeInfoBeforeAdminWatchImpl,
    dependencies: [UiService]
});
