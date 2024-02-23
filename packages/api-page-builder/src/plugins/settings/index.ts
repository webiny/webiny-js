import { createInitialPageCategoryForNewLocale } from "./createInitialPageCategoryForNewLocale";
import { createSettingsForNewLocale } from "./createSettingsForNewLocale";
import { deleteSettingsForDeletedLocale } from "./deleteSettingsForDeletedLocale";

export default [
    createInitialPageCategoryForNewLocale,
    createSettingsForNewLocale,
    deleteSettingsForDeletedLocale
];
