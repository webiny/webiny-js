import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { Plugin } from "@webiny/app-admin";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { plugins } from "@webiny/plugins";
import { CmsEntryFilterStatusPlugin } from "~/types";
import { ContentEntryListConfig } from "../ContentEntryListConfig";

const { Browser } = ContentEntryListConfig;

const DropdownContainer = styled.div`
    width: 200px;
`;

const FilterByStatus: React.FC = () => {
    const bind = useBind({
        name: "status",
        defaultValue: "all",
        beforeChange(value, cb) {
            cb(value === "all" ? undefined : value);
        }
    });

    const filterStatusPlugins = useMemo(() => {
        return plugins.byType<CmsEntryFilterStatusPlugin>("cms.entry.filter.status");
    }, []);

    const options = [
        { label: "All", value: "all" },
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Unpublished", value: "unpublished" }
    ];

    filterStatusPlugins.forEach(pl => {
        options.push({ label: pl.label, value: pl.value });
    });

    return (
        <DropdownContainer>
            <Select {...bind} size={"medium"} placeholder={"Filter by status"} options={options} />
        </DropdownContainer>
    );
};

export const ContentEntriesModule: React.FC = () => {
    return (
        <>
            <Plugin>
                <ContentEntryListConfig>
                    <Browser.Filter
                        name={"status"}
                        element={
                            <span>
                                Status: blog <FilterByStatus />
                            </span>
                        }
                        modelIds={["blog"]}
                    />
                    <Browser.Filter
                        name={"carFilter"}
                        element={
                            <span>
                                Status: car <FilterByStatus />
                            </span>
                        }
                        modelIds={["car"]}
                    />
                    <Browser.Filter
                        name={"shared"}
                        element={
                            <span>
                                Shared <FilterByStatus />
                            </span>
                        }
                    />
                    {/*<Sorter name={"savedOn_DESC"} label={"Newest to oldest"} />*/}
                    {/*<Sorter name={"savedOn_ASC"} label={"Oldest to newest"} />*/}
                </ContentEntryListConfig>
            </Plugin>
        </>
    );
};
