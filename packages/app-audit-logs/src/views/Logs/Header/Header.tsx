import React from "react";
import { ButtonFilters } from "~/views/Logs/Header/ButtonFilters/index.js";
import { Text } from "~/components/Text.js";

type HeaderProps = {
    title: string;
    showingFilters: boolean;
    hideFilters: () => void;
    showFilters: () => void;
};

export const Header = ({ title, showingFilters, hideFilters, showFilters }: HeaderProps) => {
    return (
        <div className="box-border w-full border-b border-neutral-dimmed px-md py-sm">
            <div className="flex items-center justify-between">
                <Text use={"headline5"}>{title}</Text>
                <ButtonFilters
                    showingFilters={showingFilters}
                    hideFilters={hideFilters}
                    showFilters={showFilters}
                />
            </div>
        </div>
    );
};
