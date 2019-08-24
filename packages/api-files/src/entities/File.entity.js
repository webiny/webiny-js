// @flow
import { Entity } from "@webiny/entity";

export interface IFile extends Entity {
    createdBy: ?Entity;
    src: string;
    description: string;
    name: string;
    tags: Array<string>;
}

export function fileFactory(context: Object): Class<IFile> {
    return class File extends Entity {
        static classId = "File";

        createdBy: ?Entity;
        src: string;
        description: string;
        name: string;
        type: string;
        tags: Array<string>;
        constructor() {
            super();

            const { getUser, getEntity } = context;

            this.attr("createdBy")
                .char()
                .setSkipOnPopulate();

            this.attr("src")
                .char()
                .setValidators("required,maxLength:200");

            this.attr("size").integer();
            this.attr("type")
                .char()
                .setValidators("maxLength:50");
            this.attr("name")
                .char()
                .setValidators("maxLength:100");

            this.attr("meta").object();

            this.attr("tags")
                .array()
                .onSet(value => {
                    if (Array.isArray(value)) {
                        return value.map(item => item.toLowerCase());
                    }

                    return value;
                })
                .setValidators(tags => {
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
                if (!this.src.startsWith("/") || this.src.startsWith("http")) {
                    throw Error(
                        `File "src" must be a relative path, starting with forward slash ("/").`
                    );
                }

                if (await getEntity("File").findOne({ query: { src: this.src } })) {
                    throw Error(`File "src" must be unique (used "${this.src}").`);
                }

                if (getUser()) {
                    this.createdBy = getUser().id;
                }
            });
        }
    };
}
