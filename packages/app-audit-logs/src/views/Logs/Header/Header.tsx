import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid/index.js";
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
        <div className="box-border w-full border-b border-neutral-dimmed px-5 py-2">
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <div className="flex h-full items-center">
                        <Text use={"headline5"}>{title}</Text>
                    </div>
                </Cell>
                <Cell span={8}>
                    <div className="flex h-full w-full items-center justify-end">
                        <ButtonFilters
                            showingFilters={showingFilters}
                            hideFilters={hideFilters}
                            showFilters={showFilters}
                        />
                    </div>
                </Cell>
            </Grid>
        </div>
    );
};
