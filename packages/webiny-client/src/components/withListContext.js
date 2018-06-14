import React from "react";
import ListContext from "./ListContext";

export default function withListContext() {
    return Target => {
        const ListContextHOC = ({ children, ...props }) => {
            return (
                <ListContext {...props}>
                    {listProps => (
                        <Target {...props} {...listProps}>
                            {children}
                        </Target>
                    )}
                </ListContext>
            );
        };

        ListContextHOC.displayName = "ListContextHOC";

        return ListContextHOC;
    };
}
