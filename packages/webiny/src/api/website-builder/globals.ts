// Replace the repositories to keep global components in another system.
export {
    GetGlobalComponentUseCase,
    GetGlobalComponentRepository
} from "@webiny/api-website-builder/features/globals/GetGlobalComponent/abstractions.js";
export {
    ListGlobalComponentsUseCase,
    ListGlobalComponentsRepository
} from "@webiny/api-website-builder/features/globals/ListGlobalComponents/abstractions.js";
export { ListPageGlobalComponentsUseCase } from "@webiny/api-website-builder/features/globals/ListPageGlobalComponents/abstractions.js";
export {
    SaveGlobalComponentUseCase,
    SaveGlobalComponentRepository,
    GlobalComponentBeforeSaveEventHandler,
    GlobalComponentAfterSaveEventHandler
} from "@webiny/api-website-builder/features/globals/SaveGlobalComponent/abstractions.js";
export type { GlobalComponent } from "@webiny/api-website-builder/domain/globals/abstractions.js";
export { GlobalComponentLanguage } from "@webiny/api-website-builder/domain/globals/GlobalComponentLanguage.js";
export { ElementBindings } from "@webiny/api-website-builder/domain/shared/ElementBindings.js";
