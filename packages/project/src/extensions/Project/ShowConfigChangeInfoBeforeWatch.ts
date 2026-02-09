import { AdminBeforeWatch, ApiBeforeWatch, UiService } from "~/abstractions/index.js";

class ShowConfigChangeInfoBeforeWatchImpl
    implements AdminBeforeWatch.Interface, ApiBeforeWatch.Interface
{
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

export const ShowConfigChangeInfoBeforeWatch = {
    Admin: AdminBeforeWatch.createImplementation({
        implementation: ShowConfigChangeInfoBeforeWatchImpl,
        dependencies: [UiService]
    }),
    Api: ApiBeforeWatch.createImplementation({
        implementation: ShowConfigChangeInfoBeforeWatchImpl,
        dependencies: [UiService]
    })
};
