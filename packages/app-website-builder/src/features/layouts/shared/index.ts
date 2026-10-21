export { SharedLayoutsInfrastructureFeature } from "./feature.js";
export { LayoutsRepository, LayoutsGateway } from "./abstractions.js";
export type {
    Layout,
    LayoutProperties,
    CreateLayoutData,
    UpdateLayoutData,
    LayoutSettings
} from "./abstractions.js";
export {
    LayoutError,
    LAYOUT_IN_USE_ERROR,
    isLayoutInUseError,
    getLayoutInUseMessage,
    getLayoutErrorMessage
} from "./errors.js";
export type { LayoutInUseData, LayoutInUseError } from "./errors.js";
