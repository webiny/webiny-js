export interface ReviewContentTypeOption {
    label: string;
    value: string;
}

/*
 * The content types a list can be filtered by (D113). Values are what `where.modelId` carries; an
 * app without content types (Website Builder) passes `null` instead.
 */
export interface IReviewContentTypeFilter {
    options: ReviewContentTypeOption[];
}
