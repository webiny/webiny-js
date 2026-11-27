import React from "react";
import { Loader } from "@webiny/admin-ui";

export interface ListStatusProps {
    loading: boolean;
}

export const ListStatus = ({ loading }: ListStatusProps) => {
    if (!loading) {
        return null;
    }

    return (
        <div className={"absolute right-0 bottom-sm-plus mr-sm-plus flex items-center"}>
            <div className={"mr-[5px] inline-block"}>{"Loading more items..."}</div>
            <div className={"relative size-sm-extra inline-block"}>
                <Loader size={"xs"} />
            </div>
        </div>
    );
};
