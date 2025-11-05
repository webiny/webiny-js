import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

type LoadingProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>;

const Loading = (props: LoadingProps) => (
    <CommandPrimitive.Loading
        className="bg-neutral-base text-neutral-strong fill-neutral-xstrong rounded-sm p-sm mx-sm text-md outline-none"
        {...props}
    />
);

export { Loading, type LoadingProps };
