export interface ResolveEndsOnParams {
    // The date in the field, `yyyy-MM-dd`; `null` when cleared or never set.
    pickedDate: string | null;
    // The date the field was pre-filled with (`getLocalDate` of the stored end); `null` for none.
    originalDate: string | null;
    // The stored end as loaded; `null` for none.
    originalEndsOn: string | null;
    timeZone: string;
}
