/**
 * Plugin registry — all abstraction plugins are registered here.
 * To add a new abstraction type, import and add it to the array.
 */
import { eventHandlerPlugin } from "./event-handler.js";
import { useCasePlugin } from "./use-case.js";

export const plugins = [eventHandlerPlugin, useCasePlugin];
