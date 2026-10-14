import { createAbstraction } from "@webiny/feature/api";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";

export interface IAutomationDefinitionRegistryService {
    /** The definition with this id; `null` when none is registered. */
    get(id: string): AutomationDefinition.Interface | null;
    /** Registration order; the last registration per `id` wins and keeps the first one's place. */
    list(): AutomationDefinition.Interface[];
}

/** The registered automation definitions (R133). */
export const AutomationDefinitionRegistryService =
    createAbstraction<IAutomationDefinitionRegistryService>("AutomationDefinitionRegistryService");

export namespace AutomationDefinitionRegistryService {
    export type Interface = IAutomationDefinitionRegistryService;
}
