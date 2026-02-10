import { ApiBeforeWatch, UiService } from "~/abstractions/index.js";

class ShowConfigChangeInfoBeforeApiWatchImpl implements ApiBeforeWatch.Interface {
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

export const ShowConfigChangeInfoBeforeApiWatch = ApiBeforeWatch.createImplementation({
    implementation: ShowConfigChangeInfoBeforeApiWatchImpl,
    dependencies: [UiService]
});
