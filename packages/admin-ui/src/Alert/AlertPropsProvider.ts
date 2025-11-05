import { createComponentPropsProvider } from "~/utils.js";
import { AlertProps } from "./Alert.js";

const [AlertPropsProvider, useAlertProps] = createComponentPropsProvider<AlertProps>()

export { AlertPropsProvider, useAlertProps };