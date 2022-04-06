/**
 * TODO remove when upgraded to react 17
 */
import "react";

declare module "react" {
    export type HTMLAttributeAnchorTarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});
}
