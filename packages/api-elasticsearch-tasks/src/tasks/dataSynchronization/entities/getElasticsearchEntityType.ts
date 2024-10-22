export enum EntityType {
    CMS = "headless-cms",
    PAGE_BUILDER = "page-builder",
    FORM_BUILDER = "form-builder",
    FORM_BUILDER_SUBMISSION = "form-builder-submission"
}

export const getElasticsearchEntityType = (index: string): EntityType => {
    if (index.includes("-headless-cms-")) {
        return EntityType.CMS;
    } else if (index.includes("-page-builder-")) {
        return EntityType.PAGE_BUILDER;
    } else if (index.includes("-form-builder-submission")) {
        return EntityType.FORM_BUILDER_SUBMISSION;
    } else if (index.includes("-form-builder-")) {
        return EntityType.FORM_BUILDER;
    }
    throw new Error(`Unknown entity type for index "${index}".`);
};
