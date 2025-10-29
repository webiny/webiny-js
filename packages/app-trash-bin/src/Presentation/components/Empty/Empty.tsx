import React from "react";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as TrashIcon } from "@webiny/icons/delete_forever.svg";
import { EmptyView } from "@webiny/app-admin";
import { useTrashBin } from "~/Presentation/hooks/index.js";

export const Empty = () => {
    const { vm } = useTrashBin();

    return (
        <div className={"flex items-center justify-center w-full h-full"}>
            <div className={"flex items-center flex-cols"}>
                {vm.isSearchView ? (
                    <EmptyView icon={<SearchIcon />} title={"No items found."} action={null} />
                ) : (
                    <EmptyView
                        icon={<TrashIcon />}
                        title={`Nothing found in the trash: items left in the trash are automatically deleted after ${vm.retentionPeriod}.`}
                        action={null}
                    />
                )}
            </div>
        </div>
    );
};
