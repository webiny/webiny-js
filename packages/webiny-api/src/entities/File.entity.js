// @flow
import { Entity } from "webiny-entity";

export const fileFactory = ({ user = {} }: Object) => {
    class File extends Entity {
        createdBy: Entity;
        size: number;
        type: string;
        src: string;
        name: string;

        constructor() {
            super();
            this.attr("createdBy")
                .char()
                .setDefaultValue(user.id);

            this.attr("size").integer();

            this.attr("type")
                .char()
                .setValidators("maxLength:50");

            this.attr("src")
                .char()
                .setValidators("required,maxLength:200");

            this.attr("name")
                .char()
                .setValidators("maxLength:500");

            this.on("beforeCreate", async () => {
                // TODO: improve this if needed in the future.
                if (!this.src.startsWith("/") || this.src.startsWith("http")) {
                    throw Error(`File "src" must be a relative path, starting with forward slash ("/").`);
                }

                if (await File.findOne({ query: { src: this.src } })) {
                    throw Error(`File "src" must be unique. `);
                }
            });
        }
    }

    File.classId = "File";

    return File;
};
