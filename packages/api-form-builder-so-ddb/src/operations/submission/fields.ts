import { FormSubmissionDynamoDbFieldPlugin } from "~/plugins/FormSubmissionDynamoDbFieldPlugin";

export default () => [
    new FormSubmissionDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    }),
    new FormSubmissionDynamoDbFieldPlugin({
        field: "savedOn",
        type: "date"
    })
];
