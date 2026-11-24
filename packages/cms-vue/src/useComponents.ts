import { computed } from "vue";
import { inject } from "vue";
import type { Ref } from "vue";
import type { Component } from "@webiny/cms-sdk";
import { COMPONENTS_KEY } from "./injectionKeys.js";

/**
 * The components passed to the closest `EntryRenderer`.
 */
export const useComponents = (): Ref<Component[]> => {
    const none = computed((): Component[] => []);
    return inject(COMPONENTS_KEY, none);
};
