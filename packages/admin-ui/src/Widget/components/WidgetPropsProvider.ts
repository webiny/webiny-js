import { createComponentPropsProvider } from "~/utils.js";
import { type WidgetProps } from "../Widget.js";

const [WidgetPropsProvider, useWidgetProps] = createComponentPropsProvider<WidgetProps>();

export { WidgetPropsProvider, useWidgetProps };
