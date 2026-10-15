import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";

export const INTEGRATION_MODEL_ID = "activityLogTestArticle";

/**
 * A public model for the capture integration tests.
 *
 * Public, not private — the whole point is to exercise the path a real editor's entry takes, and a
 * private model is filtered out by the recorder before anything is written.
 *
 * Shaped to cover the differ's interesting cases: a scalar, a nested object, and a repeatable
 * object whose items can gain ids.
 */
class IntegrationTestModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: INTEGRATION_MODEL_ID,
                    name: "Activity Log Test Article",
                    group: "activityLogTests"
                })
                .fields(fields => ({
                    title: fields.text().label("Title"),
                    author: fields
                        .object()
                        .label("Author")
                        .fields(child => ({
                            name: child.text().label("Name")
                        })),
                    sections: fields
                        .object()
                        .label("Sections")
                        .list()
                        .fields(child => ({
                            heading: child.text().label("Heading")
                        }))
                }))
        ];
    }
}

export const IntegrationTestModel = ModelFactory.createImplementation({
    implementation: IntegrationTestModelImpl,
    dependencies: []
});
