import { type UiService } from "~/abstractions/index.js";

let shown = false;

/**
 * The "restart the watch command" notice is wired per app (`ApiBeforeWatch` + `AdminBeforeWatch`), but a
 * single `webiny watch` can now cover several apps in one process — self-hosted watches api and admin
 * together. The message is identical either way, so print it once per process instead of once per app.
 */
export const showConfigChangeNotice = (ui: UiService.Interface) => {
    if (shown) {
        return;
    }

    shown = true;

    ui.info(
        [
            "Changes done in %s are not reloaded automatically.",
            "You'll have to restart the watch command in order for your changes to take effect."
        ].join(" "),
        "webiny.config.tsx"
    );
};
