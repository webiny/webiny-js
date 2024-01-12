export const onByFields = [
    "createdOn: DateTime!",
    "modifiedOn: DateTime",
    "savedOn: DateTime!",
    "createdBy: ApwIdentity!",
    "modifiedBy: ApwIdentity",
    "savedBy: ApwIdentity!"
].join("\n");

export const dateTimeFieldsSorters = [
    "createdOn_ASC",
    "createdOn_DESC",
    "modifiedOn_ASC",
    "modifiedOn_DESC",
    "savedOn_ASC",
    "savedOn_DESC"
].join("\n");
