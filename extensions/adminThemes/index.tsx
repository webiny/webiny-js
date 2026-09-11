import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import { webinyDark } from "./themes/webinyDark.js";
import { dracula } from "./themes/dracula.js";
import { githubDark } from "./themes/githubDark.js";
import { oneDarkPro } from "./themes/oneDarkPro.js";
import { tokyoNight } from "./themes/tokyoNight.js";
import { catppuccinMocha } from "./themes/catppuccinMocha.js";

/**
 * Admin themes extension.
 *
 * Registers selectable dark themes into the admin UI. Each theme is an individual file under
 * `./themes`; import the ones you want and add them to the list below. They appear in the
 * sidebar theme switcher. The built-in "Light" theme is always available and is the default
 * when nothing is stored in local storage — it does not need to be registered.
 *
 * To add your own theme: create a file with `createTheme({ id, name, variables })` (spread
 * `darkThemeBase` from `webiny/admin/configs` for a dark theme, then override the raw
 * `--color-neutral-*` ramp and `--color-primary-*` accent), import it here, and register it.
 */
const themes = [webinyDark, dracula, githubDark, oneDarkPro, tokyoNight, catppuccinMocha];

const AdminThemes = () => {
    return (
        <AdminConfig.Public>
            {themes.map(theme => (
                <AdminConfig.Theme.Register key={theme.id} theme={theme} />
            ))}
        </AdminConfig.Public>
    );
};

export default AdminThemes;
