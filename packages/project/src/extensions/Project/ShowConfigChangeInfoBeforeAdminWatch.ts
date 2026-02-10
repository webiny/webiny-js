import { AdminBeforeWatch, UiService } from "~/abstractions/index.js";

class ShowConfigChangeInfoBeforeAdminWatchImpl implements AdminBeforeWatch.Interface {
    constructor(private ui: UiService.Interface) {}

    async execute() {
        this.ui.info(
            [
                "Changes done in %s are not reloaded automatically.",
                "You'll have to restart the watch command in order for your changes to take effect."
            ].join(" "),
            "webiny.config.tsx"
        );
    }
}

export const ShowConfigChangeInfoBeforeAdminWatch = AdminBeforeWatch.createImplementation({
    implementation: ShowConfigChangeInfoBeforeAdminWatchImpl,
    dependencies: [UiService]
});
