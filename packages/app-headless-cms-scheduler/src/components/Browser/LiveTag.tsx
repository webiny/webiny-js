import React from "react";
import { Tag } from "@webiny/admin-ui";

export const LiveTag = ({ version }: { version: number }) => (
    <Tag swatchColor={"#5AC84C"} variant={"success-light"} content={`Live (v${version})`} />
);
