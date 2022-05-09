import { Context } from "~/types";

export default class TargetDataModelsResolver {
    protected readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    /**
     * Generates primary key (PK), to be used upon mutating / querying DynamoDB data.
     * @param base
     */
    getPK(base = "TargetDataModel") {
        // If our GraphQL API uses the Webiny I18N application, we can use
        // the current locale code as the prefix for our primary keys (PKs).
        // https://github.com/webiny/webiny-js/tree/v5.12.0/packages/api-i18n
        const locale = this.context.i18n.getContentLocale().code;
        base = `L#${locale}#${base}`;

        // In integration test environments, we use the `process.env.TEST_RUN_ID` as a suffix.
        // This helps us isolate the created test data and perform assertions in our tests.
        if (process.env.TEST_RUN_ID) {
            base += "_TEST_RUN_" + process.env.TEST_RUN_ID;
        }

        return base;
    }
}
