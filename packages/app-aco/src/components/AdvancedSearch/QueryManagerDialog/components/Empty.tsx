import React from "react";
import { ReactComponent as SettingsIcon } from "@webiny/icons/tune.svg";
import { Text } from "@webiny/admin-ui";

export const Empty = () => {
    return (
        <div className="py-xl">
            <div className="w-full flex flex-col items-center justify-center gap-md">
                <div className="flex justify-center">
                    <div className="flex justify-center items-center size-[72px] bg-neutral-dimmed rounded-full fill-neutral-strong [&_svg]:size-xl">
                        <SettingsIcon />
                    </div>
                </div>
                <Text size={"md"} className={"text-center"} as={"div"}>
                    {"No filters found."}
                </Text>
            </div>
        </div>
    );
};
