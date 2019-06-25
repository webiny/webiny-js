// @flow
import { I18NCharAttribute, I18NObjectAttribute } from "webiny-api-forms/__i18n/attributes";
import { Entity, type EntityCollection } from "webiny-entity";
import { Model } from "webiny-model";
import mdbid from "mdbid";

export interface IFormSettings extends Entity {
    name: string;
    stats: {
        views: number,
        submissions: number,
        conversionRate: number,
        incrementViews: () => void,
        incrementSubmissions: () => void
    };
}

class LayoutSettingsModel extends Model {
    constructor() {
        super();
        this.attr("renderer")
            .char()
            .setValue("default");
    }
}

class FormStatsModel extends Model {
    views: number;
    submissions: number;
    conversionRate: number;

    constructor() {
        super();
        this.attr("views")
            .integer()
            .setDefaultValue(0);
        this.attr("submissions")
            .integer()
            .setDefaultValue(0);
        this.attr("conversionRate")
            .float()
            .setDynamic(() => {
                if (this.views > 0) {
                    return ((this.submissions / this.views) * 100).toFixed(2);
                }
                return 0;
            });
    }

    incrementViews() {
        this.views++;
    }

    incrementSubmissions() {
        this.submissions++;
    }
}

const createFieldModel = context =>
    class FieldModel extends Model {
        constructor() {
            super();
            this.attr("id")
                .char()
                .setValidators("required");
            this.attr("fieldId")
                .char()
                .setValidators("required");
            this.attr("type")
                .char()
                .setValidators("required");
            this.attr("label").custom(I18NCharAttribute, context);
            this.attr("helpText").custom(I18NCharAttribute, context);
            this.attr("placeholderText").custom(I18NCharAttribute, context);
            this.attr("defaultValue").char();
            this.attr("validation").array();
            this.attr("settings")
                .object()
                .setValue({});
        }
    };

const createSettingsModel = context =>
    class SettingsModel extends Model {
        constructor(props) {
            super(props);
            this.attr("layout")
                .model(LayoutSettingsModel)
                .setDefaultValue(new LayoutSettingsModel());

            this.attr("submitButtonLabel").custom(I18NCharAttribute, context);
            this.attr("successMessage").custom(I18NObjectAttribute, context);
        }
    };

export default (context: Object) => {
    const { getUser, getEntities } = context;
    return class CmsForm extends Entity {
        static classId = "CmsForm";

        createdBy: Entity;
        updatedBy: Entity;
        published: boolean;
        publishedOn: ?Date;
        name: string;
        snippet: string;
        fields: Array<Object>;
        layout: Array<Array<String>>;
        triggers: Object;
        settings: Object;
        version: number;
        parent: string;

        constructor() {
            super();
            const { CmsForm, SecurityUser } = getEntities();

            this.attr("createdBy")
                .entity(SecurityUser)
                .setSkipOnPopulate();

            this.attr("updatedBy")
                .entity(SecurityUser)
                .setSkipOnPopulate();

            this.attr("name")
                .char()
                .setValidators("required")
                .onSet(value => (this.published ? this.name : value));

            this.attr("fields")
                .models(createFieldModel(context))
                .onSet(value => (this.published ? this.fields : value))
                .setValue([]);

            this.attr("layout")
                .object()
                .onSet(value => (this.published ? this.layout : value))
                .setValue([]);

            this.attr("stats")
                .model(FormStatsModel)
                .setSkipOnPopulate()
                .setDefaultValue(new FormStatsModel());

            const SettingsModel = createSettingsModel(context);
            this.attr("settings")
                .model(SettingsModel)
                .onSet(value => (this.published ? this.layout : value))
                .setDefaultValue(new SettingsModel());

            this.attr("triggers")
                .object()
                .onSet(value => (this.published ? this.triggers : value));

            this.attr("revisions")
                .entities(CmsForm)
                .setDynamic(() => {
                    return CmsForm.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                });

            this.attr("version").integer();
            this.attr("parent").char();

            this.attr("publishedOn").date();
            this.attr("published")
                .boolean()
                .onSet(value => {
                    if (this.published) {
                        return this.published;
                    }

                    if (value) {
                        this.publishedOn = new Date();
                    }
                });

            this.on("beforeCreate", async () => {
                if (!this.id) {
                    this.id = mdbid();
                }

                if (!this.parent) {
                    this.parent = this.id;
                }

                if (getUser()) {
                    this.createdBy = getUser().id;
                }

                if (!this.name) {
                    this.name = "Untitled";
                }

                this.version = await this.getNextVersion();
            });

            this.on("beforeUpdate", () => {
                if (getUser()) {
                    this.updatedBy = getUser().id;
                }
            });

            this.on("afterDelete", async () => {
                // If the deleted form is the root form - delete its revisions
                if (this.id === this.parent) {
                    // Delete all revisions.
                    const { CmsForm } = getEntities();

                    const revisions: EntityCollection<CmsForm> = await CmsForm.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            });
        }

        async getNextVersion() {
            const { CmsForm } = getEntities();
            const revision: null | CmsForm = await CmsForm.findOne({
                query: { parent: this.parent, deleted: { $in: [true, false] } },
                sort: { version: -1 }
            });

            if (!revision) {
                return 1;
            }

            return revision.version + 1;
        }
    };
};
