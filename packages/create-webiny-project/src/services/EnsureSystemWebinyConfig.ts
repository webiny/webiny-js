import { globalConfig } from "@webiny/global-config";

/**
 * Makes sure `~/.webiny/config` exists before anything reads it.
 *
 * This used to write the file itself, as `{ id, telemetry: true }`, with no
 * `newUser` key. `globalConfig.get()` only fills in its defaults when the file
 * is missing or has no `id`, so a config written here satisfied that check and
 * `newUser` stayed `undefined` for the life of the machine. Telemetry reads it
 * as `Boolean(undefined)`, so every event reported `newUser: "no"` — including
 * the first event of a genuinely new user, which is the one case the flag
 * exists for. Since `create-webiny-project` is where most people meet Webiny,
 * that made the flag false for very nearly everyone.
 *
 * Delegating leaves one owner for the config shape, so there's no second
 * definition of "a fresh config" to drift.
 */
export class EnsureSystemWebinyConfig {
    execute() {
        globalConfig.get();
    }
}
