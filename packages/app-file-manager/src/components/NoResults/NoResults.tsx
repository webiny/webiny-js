import React from "react";
import { Heading } from "@webiny/admin-ui";
import { ReactComponent as SearchOffIcon } from "@webiny/icons/search_off.svg";

export const NoResults = () => {
    return (
        <div
            className={
                "w-full h-full p-lg flex items-center justify-center bg-neutral-base"
            }
        >
            <div className={"flex flex-col items-center justify-center gap-sm"}>
                <div className={"fill-neutral-strong"}>
                    <SearchOffIcon width={75} height={75} />
                </div>
                <div className={"text-center"}>
                    <Heading level={4} className={"text-neutral-strong"}>
                        {"No results found."}
                    </Heading>
                </div>
            </div>
        </div>
    );
};
