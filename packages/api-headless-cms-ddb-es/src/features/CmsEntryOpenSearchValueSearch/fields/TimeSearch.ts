import { CmsEntryOpenSearchValueSearch } from "../abstractions.js";

export class TimeSearchImpl implements CmsEntryOpenSearchValueSearch.Interface {
    public readonly fieldType = "datetime";

    public transform(params: CmsEntryOpenSearchValueSearch.Transform): any {
        const { field, value } = params;
        if (!value || field.settings?.type !== "time") {
            return value;
        }
        const [hours, minutes, seconds = 0] = value.split(":").map(Number);
        return hours * 60 * 60 + minutes * 60 + seconds;
    }

    public createPath(): string | null {
        return null;
    }
}

export const TimeSearch = CmsEntryOpenSearchValueSearch.createImplementation({
    implementation: TimeSearchImpl,
    dependencies: []
});
