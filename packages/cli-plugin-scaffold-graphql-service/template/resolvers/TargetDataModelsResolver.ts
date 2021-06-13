import { TargetDataModelsContext } from "../types";

export default class TargetDataModelMutationResolver {
    protected readonly context: TargetDataModelsContext;

    constructor(context: TargetDataModelsContext) {
        this.context = context;
    }

    /**
     * Generates primary key (PK), to be used upon mutating / querying DynamoDB data.
     * @param base
     */
    getPK(base = "TargetDataModels") {
        // By default, Webiny Admin Area supports content creation in multiple locales.
        // The prepended "L#${locale}" designates to which locale our data belongs to.
        const locale = this.context.i18nContent.getLocale();
        base = `L#${locale}#${base}`;

        // In integration test environments, we use the `process.env.TEST_RUN_ID` as a suffix.
        // This helps us isolate the created test data and perform assertions in our tests.
        if (process.env.TEST_RUN_ID) {
            base += "_TEST_RUN_" + process.env.TEST_RUN_ID;
        }

        return base;
    }
}
