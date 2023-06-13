import { createAdvancedSingleRenderer } from "./detailedReferenceRenderer";
import { createAdvancedMultipleRenderer } from "./detailedReferencesRenderer";

export const createAdvancedRefRenderer = () => {
    return [createAdvancedSingleRenderer(), createAdvancedMultipleRenderer()];
};
