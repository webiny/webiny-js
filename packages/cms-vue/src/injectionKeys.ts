import type { InjectionKey } from "vue";
import type { Ref } from "vue";
import type { CmsModelDefinition } from "@webiny/cms-sdk";
import type { Component } from "@webiny/cms-sdk";
import type { EntryStore } from "@webiny/cms-sdk";

export const ENTRY_STORE_KEY: InjectionKey<EntryStore> = Symbol("WebinyEntryStore");
export const COMPONENTS_KEY: InjectionKey<Ref<Component[]>> = Symbol("WebinyCmsComponents");
export const MODEL_KEY: InjectionKey<Ref<CmsModelDefinition | null>> = Symbol("WebinyCmsModel");
