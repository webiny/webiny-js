/*
 * The admin-ui `Label` never wraps its text (`whitespace-nowrap`), so a long checkbox or radio item
 * label would make the step drawer scroll sideways. Item label content gets this class to wrap.
 */
export const WRAPPING_LABEL_CLASS_NAME = "whitespace-normal min-w-0";
