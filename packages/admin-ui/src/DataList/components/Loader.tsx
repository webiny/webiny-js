import type { ReactElement } from "react";
import React from "react";
import { Skeleton } from "~/Skeleton/index.js";
import { cn } from "~/utils.js";

const Loader = (): ReactElement => {
    const lines = Array.from(Array(5).keys());

    return (
        <ul className={"list-none p-lg"} data-testid={"default-data-list.loading"}>
            {lines.map(line => (
                <li
                    key={"list-" + line}
                    className={cn(["group", line === lines.length - 1 ? "last-item" : ""])}
                >
                    <div className="flex w-full items-center justify-start gap-lg mb-md group-[.last-item]:mb-none">
                        <Skeleton type={"thumbnail"} size={"xxl"} />
                        <div
                            className={
                                "flex-1 h-10 flex flex-col justify-between"
                            }
                        >
                            <Skeleton type={"text"} size={"md"} />
                            <Skeleton type={"text"} size={"md"} />
                        </div>
                        <div className={"justify-self-end"}>
                            <div className={"text-right flex justify-end gap-sm"}>
                                <Skeleton type={"thumbnail"} size={"lg"} />
                                <Skeleton type={"thumbnail"} size={"lg"} />
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export { Loader };
