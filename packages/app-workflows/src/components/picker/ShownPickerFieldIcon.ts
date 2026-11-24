import type { PickerFieldIcon } from "./PickerFieldIcon.js";

// The picker field icons that render an icon: every name but `none`.
export type ShownPickerFieldIcon = Exclude<PickerFieldIcon, "none">;
