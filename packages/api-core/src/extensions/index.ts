// Event handlers.
import { ApiKeyAfterCreate as ApiKeyAfterCreateExt } from "./eventHandlers/index.js";

// Exports.
export const ApiKeyAfterCreate = ApiKeyAfterCreateExt.ReactComponent;

// Definitions (used internally). 👇
export const definitions = [ApiKeyAfterCreateExt.definition];
