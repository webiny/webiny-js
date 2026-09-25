import semver from "semver";

/*
 * Reads the Yarn version out of the environment instead of spawning `yarn --version`.
 *
 * Yarn sets `npm_config_user_agent` on every process it starts, and it names itself in there:
 * "yarn/4.18.0 npm/? node/v24.18.1 darwin arm64". When the CLI was started with `yarn webiny ...`,
 * which is what the docs tell people to run and what every script in this repo does, that is the Yarn
 * that will actually run the commands. So the value is both free and authoritative.
 *
 * Returns null when the CLI was started some other way, running the binary directly for instance,
 * where the agent describes npm rather than yarn. Also returns null if the version is not something
 * `semver` can compare, so that an unexpected format falls back to asking Yarn directly rather than
 * failing a check it should have passed.
 */
export const yarnVersionFromUserAgent = () => {
    const userAgent = process.env.npm_config_user_agent;
    if (!userAgent) {
        return null;
    }

    const match = userAgent.match(/(?:^|\s)yarn\/(\S+)/);
    if (!match) {
        return null;
    }

    const version = match[1];
    if (!semver.valid(version)) {
        return null;
    }

    return version;
};
