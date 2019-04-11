// @flow
import { Entity } from "webiny-entity";

export interface IFile extends Entity {
    size: number;
    type: string;
    src: string;
    name: string;
}

export const fileFactory = ({ user = {} }: IFile) => {
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
                .setDefaultValue(user.id)
                .setOnce();

            this.attr("size")
                .integer()
                .setValidators("required")
                .setOnce();

            this.attr("type")
                .char()
                .setValidators("required,maxLength:50")
                .setOnce();

            this.attr("src")
                .char()
                .setValidators("required,maxLength:200")
                .setOnce();

            this.attr("name")
                .char()
                .setValidators("required,maxLength:100");

            this.attr("tags")
                .array()
                .setValidators(function(tags) {
                    if (Array.isArray(tags)) {
                        if (tags.length > 15) {
                            throw Error("You cannot set more than 15 tags.");
                        }

                        for (let i = 0; i < tags.length; i++) {
                            let tag = tags[i];
                            if (typeof tag !== "string") {
                                throw Error("Tag must be typeof string.");
                            }

                            if (tag.length > 50) {
                                throw Error(`Tag ${tag} is more than 50 characters long.`);
                            }
                        }
                    }
                });

            this.on("beforeCreate", async () => {
                // TODO: improve this if needed in the future.
                if (!this.src.startsWith("/") || this.src.startsWith("http")) {
                    throw Error(
                        `File "src" must be a relative path, starting with forward slash ("/").`
                    );
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
