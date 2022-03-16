/**
 * TODO remove when upgraded to react 17
 */
import React from "react";

declare module "react" {
    export type HTMLAttributeAnchorTarget = '_self' | '_blank' | '_parent' | '_top' | (string & {});
}