/**
 * Creates a PK used upon storing data into DynamoDB.
 * In test environments, we use the `process.env.TEST_RUN_ID` as a suffix. This
 * helps us isolate the created test data and perform assertions in oru tests.
 * @param base
 */
export const getPK = (base = "Targets") => {
    if (process.env.TEST_RUN_ID) {
        return base + "_TEST_RUN_" + process.env.TEST_RUN_ID;
    }
    return base;
};

export const PK = getPK();
