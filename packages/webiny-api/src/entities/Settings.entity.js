// @flow
import { Entity } from "webiny-entity";

export default ({ user = {} }: Object) => {
    class Settings extends Entity {
        static key: string;
        key: string;
        data: Object;

        constructor() {
            super();
            this.attr("createdBy")
                .char()
                .setDefaultValue(user.id);
            this.attr("key")
                .char()
                .setValidators("required");

            this.attr("data").object();
        }

        static async load(): Promise<Settings | null> {
            const settings: any = await this.findOne({ query: { key: this.key } });
            return (settings: Settings | null);
        }
    }

    Settings.classId = "Settings";
    Settings.storageClassId = "Settings";

    return Settings;
};
