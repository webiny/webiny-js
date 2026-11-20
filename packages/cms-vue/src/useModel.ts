import { computed } from "vue";
import { inject } from "vue";
import type { Ref } from "vue";
import type { CmsModelDefinition } from "@webiny/cms-sdk";
import { MODEL_KEY } from "./injectionKeys.js";

/**
 * The model passed to the closest `EntryRenderer`.
 */
export const useModel = (): Ref<CmsModelDefinition | null> => {
    const none = computed((): CmsModelDefinition | null => null);
    return inject(MODEL_KEY, none);
};
