// @flow
import invariant from "invariant";
import { settingsFactory as Settings } from "webiny-api/entities/Settings.entity";

export function userSettingsFactory({ user }: Object) {
    class UserSettings extends Settings({ user }) {
        static async load(key: ?string): Promise<UserSettings | null> {
            // Since Flow requires these parameters to be optional, we enforce them this way.
            invariant(key, "Must provide `key` argument to `UserSettings.load` method.");

            const settings: any = await this.findOne({ query: { key, createdBy: user.id } });
            return (settings: UserSettings | null);
        }
    }

    UserSettings.classId = "UserSettings";

    return UserSettings;
}
