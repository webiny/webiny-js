import React from "react";
import { Separator } from "~/Separator/index.js";

import { cva, type VariantProps } from "~/utils.js";

const separatorVariants = cva(["h-xl ml-px"], {
    variants: {
        variant: {
            "group-label": "!h-[38px]"
        }
    }
});

export interface SidebarMenuSubItemIndentationProps
    extends Omit<React.HTMLAttributes<HTMLLIElement>, "content">,
        VariantProps<typeof separatorVariants> {
    lvl: number;
}

const SidebarMenuSubItemIndentation = ({ lvl, variant }: SidebarMenuSubItemIndentationProps) => {
    return (
        <div data-sidebar="indentation" className={"gap-x-xs flex mr-sm"}>
            {Array.from({ length: lvl }, (_, index) => (
                <div data-sidebar={"indentation-element"} className={"ml-md"} key={lvl + index}>
                    <Separator
                        orientation={"vertical"}
                        margin={"none"}
                        variant={"strong"}
                        className={separatorVariants({ variant })}
                    />
                </div>
            ))}
        </div>
    );
};

export { SidebarMenuSubItemIndentation };
