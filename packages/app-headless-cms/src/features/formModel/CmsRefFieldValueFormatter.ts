import {
    FieldValueFormatter,
    type IFieldVM
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { ReferenceTitles } from "~/features/contentEntry/referenceTitles/abstractions.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";

function isReference(value: unknown): value is CmsReferenceValue {
    const ref = value as CmsReferenceValue | null;
    return typeof ref?.id === "string" && typeof ref?.modelId === "string";
}

class CmsRefFieldValueFormatterImpl implements FieldValueFormatter.Interface {
    readonly type = "ref";

    constructor(private titles: ReferenceTitles.Interface) {}

    format(field: IFieldVM): string | undefined {
        const values = Array.isArray(field.value) ? field.value : [field.value];
        const titles = values.filter(isReference).map(ref => this.titles.getTitle(ref));
        // Show nothing until every title is in, rather than a list that fills in one at a time.
        if (titles.some(title => title === undefined)) {
            return undefined;
        }
        return titles.filter(Boolean).join(", ");
    }
}

export const CmsRefFieldValueFormatter = FieldValueFormatter.createImplementation({
    implementation: CmsRefFieldValueFormatterImpl,
    dependencies: [ReferenceTitles]
});
