// @flow
import { I18NCharAttribute, I18NObjectAttribute } from "webiny-api-i18n/attributes";
import { Entity, type EntityCollection } from "webiny-entity";
import { Model } from "webiny-model";
import mdbid from "mdbid";
import { getPlugins } from "webiny-plugins";
import { pick } from "lodash";

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
        this.submissions = this.submissions + 1;
    }
}

const createFieldOptionsModel = context =>
    class SettingsModel extends Model {
        constructor(props) {
            super(props);
            this.attr("label").custom(I18NCharAttribute, context);
            this.attr("value")
                .char()
                .setValue("");
        }
    };

const createFieldValidationModel = context =>
    class FieldValidationModel extends Model {
        constructor(props) {
            super(props);
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("message").custom(I18NCharAttribute, context);
            this.attr("settings")
                .object()
                .setValue({});
        }
    };

const createFieldModel = context =>
    class FieldModel extends Model {
        constructor() {
            super();
            this.attr("_id")
                .char()
                .setValidators("required");
            this.attr("type")
                .char()
                .setValidators("required");
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("fieldId")
                .char()
                .setValidators("required");
            this.attr("label").custom(I18NCharAttribute, context);
            this.attr("helpText").custom(I18NCharAttribute, context);
            this.attr("placeholderText").custom(I18NCharAttribute, context);
            this.attr("options").models(createFieldOptionsModel(context));
            this.attr("validation").models(createFieldValidationModel(context));
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
    return class Form extends Entity {
        static classId = "Form";

        createdBy: Entity;
        updatedBy: Entity;
        published: boolean;
        locked: boolean;
        publishedOn: ?Date;
        name: string;
        snippet: string;
        fields: Array<Object>;
        layout: Array<Array<String>>;
        triggers: Object;
        settings: Object;
        stats: FormStatsModel;
        version: number;
        parent: string;

        constructor() {
            super();
            const { Form, SecurityUser } = getEntities();

            this.attr("createdBy")
                .entity(SecurityUser)
                .setSkipOnPopulate();

            this.attr("updatedBy")
                .entity(SecurityUser)
                .setSkipOnPopulate();

            this.attr("name")
                .char()
                .setValidators("required")
                .onSet(value => (this.locked ? this.name : value));

            this.attr("fields")
                .models(createFieldModel(context))
                .onSet(value => (this.locked ? this.fields : value))
                .setValue([]);

            this.attr("layout")
                .object()
                .onSet(value => (this.locked ? this.layout : value))
                .setValue([]);

            this.attr("stats")
                .model(FormStatsModel)
                .setSkipOnPopulate()
                .setDefaultValue(new FormStatsModel());

            this.attr("overallStats")
                .model(FormStatsModel)
                .setDynamic(async () => {
                    const collection = Form.getDriver().getCollectionName(Form);
                    const [stats] = await Form.getDriver().aggregate(collection, [
                        { $match: { parent: this.parent } },
                        { $project: { stats: 1 } },
                        {
                            $group: {
                                _id: null,
                                views: {
                                    $sum: "$stats.views"
                                },
                                submissions: {
                                    $sum: "$stats.submissions"
                                }
                            }
                        }
                    ]);

                    if (!stats) {
                        return {
                            submissions: 0,
                            views: 0,
                            conversionRate: 0
                        };
                    }

                    let conversionRate = 0;
                    if (stats.views > 0) {
                        conversionRate = ((stats.submissions / stats.views) * 100).toFixed(2);
                    }
                    return {
                        ...stats,
                        conversionRate
                    };
                });

            const SettingsModel = createSettingsModel(context);
            this.attr("settings")
                .model(SettingsModel)
                .onSet(value => (this.locked ? this.layout : value))
                .setDefaultValue(new SettingsModel());

            this.attr("triggers")
                .object()
                .onSet(value => (this.locked ? this.triggers : value));

            this.attr("revisions")
                .entities(Form)
                .setDynamic(() => {
                    return Form.find({
                        query: { parent: this.parent },
                        sort: { version: -1 }
                    });
                });

            this.attr("publishedRevisions")
                .entities(Form)
                .setDynamic(() => {
                    return Form.find({
                        query: { parent: this.parent, published: true },
                        sort: { version: -1 }
                    });
                });

            this.attr("version").integer();
            this.attr("parent").char();

            this.attr("publishedOn").date();
            this.attr("published")
                .boolean()
                .onSet(value => {
                    if (value) {
                        this.publishedOn = new Date();
                        if (!this.locked) {
                            this.locked = true;
                        }
                    }

                    return value;
                });

            this.attr("locked")
                .boolean()
                .setSkipOnPopulate()
                .setDefaultValue(false);

            this.attr("status")
                .boolean()
                .setDynamic(() => {
                    if (this.published) {
                        return "published";
                    }

                    return this.locked ? "locked" : "draft";
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
                    const { Form } = getEntities();

                    const revisions: EntityCollection<Form> = await Form.find({
                        query: { parent: this.parent }
                    });

                    return Promise.all(revisions.map(rev => rev.delete()));
                }
            });
        }

        async submit({ data: rawData, meta }: { data: Object, meta: Object }) {
            const { FormSubmission } = getEntities();

            // Validate data.
            const validatorPlugins = getPlugins("form-field-validator");
            const fields = this.fields;
            const data = pick(rawData, fields.map(field => field.name));
            if (Object.keys(data).length === 0) {
                throw new Error("Form data cannot be empty.");
            }

            const invalidFields = {};
            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];
                if (Array.isArray(field.validation)) {
                    for (let j = 0; j < field.validation.length; j++) {
                        let validator = field.validation[j];
                        const validatorPlugin = validatorPlugins.find(
                            item => item.validator.name === validator.name
                        );
                        if (!validatorPlugin) {
                            continue;
                        }

                        let isInvalid = true;
                        try {
                            const result = await validatorPlugin.validator.validate(
                                data[field.name],
                                validator
                            );
                            isInvalid = result === false;
                        } catch (e) {
                            isInvalid = true;
                        }

                        if (isInvalid) {
                            const { i18n } = context;
                            invalidFields[field.name] =
                                i18n.getValue(validator.message) || "Invalid value";
                        }
                    }
                }
            }

            if (Object.keys(invalidFields).length > 0) {
                throw {
                    message: "Form submission contains invalid fields.",
                    data: { invalidFields }
                };
            }

            // Validation passed, let's create a form submission.
            const formSubmission = new FormSubmission();
            formSubmission.data = data;
            formSubmission.meta = meta;
            formSubmission.form = {
                parent: this.parent,
                revision: this
            };

            formSubmission.addLog({ type: "info", message: "Form submission created." });
            await formSubmission.save();

            try {
                // Execute triggers
                if (this.triggers) {
                    const plugins = getPlugins("form-trigger-handler");
                    for (let i = 0; i < plugins.length; i++) {
                        let plugin = plugins[i];
                        this.triggers[plugin.trigger] &&
                            (await plugin.handle({
                                form: this,
                                formSubmission,
                                data,
                                meta,
                                trigger: this.triggers[plugin.trigger]
                            }));
                    }
                }

                this.stats.incrementSubmissions();
                await this.save();

                formSubmission.addLog({ type: "success", message: "Form submitted successfully." });
            } catch (e) {
                formSubmission.addLog({ type: "error", message: e.message });
                throw e;
            } finally {
                await formSubmission.save();
            }
        }

        async getNextVersion() {
            const { Form } = getEntities();
            const revision: null | Form = await Form.findOne({
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
