import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../DataTable/README.md";
import {
    DataTable,
    DataTableHead,
    DataTableHeadCell,
    DataTableContent,
    DataTableBody,
    DataTableRow,
    DataTableCell
} from "./DataTable";

const story = storiesOf("Components/DataTable", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"A simple DataTable."}>
                    <DataTable>
                        <DataTableContent>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableHeadCell>Name</DataTableHeadCell>
                                    <DataTableHeadCell>Author</DataTableHeadCell>
                                    <DataTableHeadCell>Status</DataTableHeadCell>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                <DataTableRow>
                                    <DataTableCell>Home</DataTableCell>
                                    <DataTableCell>John Doe</DataTableCell>
                                    <DataTableCell>Published</DataTableCell>
                                </DataTableRow>
                                <DataTableRow>
                                    <DataTableCell>Testimonials</DataTableCell>
                                    <DataTableCell>Jane Smith</DataTableCell>
                                    <DataTableCell>Draft</DataTableCell>
                                </DataTableRow>
                                <DataTableRow>
                                    <DataTableCell>About us</DataTableCell>
                                    <DataTableCell>John Smith</DataTableCell>
                                    <DataTableCell>Published</DataTableCell>
                                </DataTableRow>
                            </DataTableBody>
                        </DataTableContent>
                    </DataTable>
                </StorySandbox>
            </Story>
        );
    },
    {
        info: {
            propTables: [
                DataTable,
                DataTableContent,
                DataTableHead,
                DataTableHeadCell,
                DataTableBody,
                DataTableRow,
                DataTableCell
            ]
        }
    }
);
