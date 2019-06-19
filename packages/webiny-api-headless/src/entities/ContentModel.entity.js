// @flow
import { Entity } from "webiny-entity";
import { Model } from "webiny-model";

class FieldModel extends Model {
    constructor() {
        super();
        this.attr("id").char();
        this.attr("label").char();
        this.attr("type").char();
        this.attr("i18n").boolean();
        this.attr("validation")
            .object()
            .setValue([]);
        this.attr("settings")
            .object()
            .setValue({});
    }
}

export interface IContentModel extends Entity {
    createdBy: ?Entity;
    title: string;
    modelId: string;
    description: string;
    fields: Array<FieldModel>;
}

export function contentModelFactory(context: Object): Class<IContentModel> {
    return class ContentModel extends Entity {
        static classId = "CmsContentModel";

        createdBy: ?Entity;
        title: string;
        modelId: string;
        description: string;
        fields: Array<FieldModel>;

        constructor() {
            super();

            const {
                user = {},
                security: {
                    entities: { User }
                }
            } = context;

            this.attr("createdBy")
                .entity(User)
                .setSkipOnPopulate();

            this.attr("title")
                .char()
                .setValidators("required");
            this.attr("modelId")
                .char()
                .setValidators("required");
            this.attr("description").char();
            this.attr("fields")
                .object()
                .setValue([]);

            this.on("beforeCreate", async () => {
                this.createdBy = user.id;
            });
        }
    };
}
