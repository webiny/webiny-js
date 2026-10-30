import { computed, defineComponent, watch, type PropType } from "vue";
import { toJS } from "mobx";
import { refCache, type CmsEntry } from "@webiny/cms-sdk";
import { useObservable } from "./useObservable.js";

export interface RefValue {
    id: string;
    modelId: string;
}

export type RefFieldValue = RefValue | RefValue[] | null | undefined;

/**
 * Resolves a reference field value to entries and passes them to the default slot.
 * The `loading` slot renders until every referenced entry is resolved.
 *
 * ```vue
 * <RefField :value="entry.values.author">
 *     <template #default="{ entries }">{{ entries[0]?.values.name }}</template>
 *     <template #loading>Loading...</template>
 * </RefField>
 * ```
 */
export const RefField = defineComponent({
    name: "WebinyRefField",
    props: {
        value: { type: [Object, Array] as PropType<RefFieldValue>, default: undefined }
    },
    setup(props, { slots }) {
        const refs = computed(() => normalizeRefs(props.value));
        const refIds = computed(() => refs.value.map(r => r.id).join(","));

        watch(
            refIds,
            () => {
                for (const ref of refs.value) {
                    refCache.resolve(ref.id, ref.modelId);
                }
            },
            { immediate: true }
        );

        // `undefined` while any referenced entry is still loading.
        const entries = useObservable(ids => {
            const resolved: CmsEntry[] = [];
            for (const id of ids ? ids.split(",") : []) {
                const entry = refCache.get(id);
                if (entry === undefined) {
                    return undefined;
                }
                if (entry !== null) {
                    resolved.push(toJS(entry));
                }
            }
            return resolved;
        }, refIds);

        return () => {
            if (refs.value.length === 0) {
                return null;
            }

            if (!entries.value) {
                return slots.loading?.() ?? null;
            }

            return slots.default?.({ entries: entries.value }) ?? null;
        };
    }
});

function normalizeRefs(value: RefFieldValue): RefValue[] {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.filter(v => v && v.id && v.modelId);
    }
    if (value.id && value.modelId) {
        return [value];
    }
    return [];
}
