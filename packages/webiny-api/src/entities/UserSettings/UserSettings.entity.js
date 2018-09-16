// @flow
import invariant from "invariant";
import Settings from "../Settings/Settings.entity";

class UserSettings extends Settings {
    static async load(key: ?string, user: ?string): Promise<UserSettings | null> {
        // Since Flow requires these parameters to be optional, we enforce them this way.
        invariant(key, "Must provide `key` argument to `UserSettings.load` method.");
        invariant(user, "Must provide `user` argument to `UserSettings.load` method.");

        const settings: any = await this.findOne({ query: { key, createdBy: user } });
        return (settings: UserSettings | null);
    }
}

UserSettings.classId = "UserSettings";

export default UserSettings;
