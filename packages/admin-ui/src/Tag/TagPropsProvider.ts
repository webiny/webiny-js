import { createComponentPropsProvider } from "~/utils.js";
import { type TagProps } from "./Tag.js";

const [TagPropsProvider, useTagProps] = createComponentPropsProvider<TagProps>();

export { TagPropsProvider, useTagProps };
