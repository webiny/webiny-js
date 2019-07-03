// @flow
import { Entity } from "webiny-entity";

export const settingsFactory = ({ getUser }: Object) => {
    class Settings extends Entity {
        static key: string;
        key: string;
        data: Object;

        constructor() {
            super();
            this.attr("createdBy").char();
            this.attr("key")
                .char()
                .setValidators("required");

            this.attr("data").object();

            this.on("beforeCreate", () => {
                this.key = this.constructor.key;
                if (getUser()) {
                    this.createdBy = getUser().id;
                }
            });
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
