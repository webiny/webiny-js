import React, { useMemo } from "react";
import { Heading, Icon, Skeleton } from "@webiny/admin-ui";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";

interface TitleProps {
    isRoot: boolean;
    title?: string;
}

export const Title = ({ title, isRoot }: TitleProps) => {
    const icon = useMemo(() => {
        return isRoot ? <HomeIcon /> : <FolderIcon />;
    }, [isRoot]);

    return (
        <div className={"w-5/12 pt-md px-lg"}>
            {(title && (
                <div className={"flex gap-sm items-center"}>
                    <Icon icon={icon} label={title} size={"md"} color={"neutral-strong"} />
                    <Heading level={4} as={"h1"} className={"truncate"}>
                        {title}
                    </Heading>
                </div>
            )) || <Skeleton size={"xl"} />}
        </div>
    );
};
