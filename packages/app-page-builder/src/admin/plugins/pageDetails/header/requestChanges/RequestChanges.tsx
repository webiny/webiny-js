import React from "react";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";

export interface RequestChangesProps {
    page: PbPageData;
}

const RequestChanges: React.FC<RequestChangesProps> = () => {
    return null;
};

export default makeComposable("RequestChanges", RequestChanges);
