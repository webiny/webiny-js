import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

type EmptyProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;

const Empty = (props: EmptyProps) => (
    <CommandPrimitive.Empty
        className="bg-neutral-base text-neutral-strong fill-neutral-xstrong rounded-sm p-sm mx-sm text-md outline-none"
        {...props}
    />
);

export { Empty, type EmptyProps };
