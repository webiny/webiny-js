import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../DataTable/README.md";
import { Columns, DataTable } from "./DataTable";

const story = storiesOf("Components/DataTable", module);

interface Entry {
    name: string;
    createdBy: string;
    lastModified: string;
    status: string;
}

story.add(
    "usage",
    () => {
        const data: Entry[] = [
            {
                name: "Page 1",
                createdBy: "John Doe",
                lastModified: "3 days ago",
                status: "Draft"
            },
            {
                name: "Page 2",
                createdBy: "John Doe",
                lastModified: "1 day ago",
                status: "Published"
            },
            {
                name: "Page 3",
                createdBy: "John Doe",
                lastModified: "1 hour ago",
                status: "Published"
            }
        ];

        const columns: Columns<Entry> = {
            name: {
                header: "Title"
            },
            createdBy: {
                header: "Author",
                cell: row => <em>{row.createdBy.toUpperCase()}</em>
            },
            lastModified: {
                header: "Last Modified"
            },
            status: {
                header: "Status",
                meta: {
                    alignEnd: true
                }
            }
        };

        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"A simple DataTable."}>
                    <DataTable data={data} columns={columns} />
                </StorySandbox>
                <StorySandbox title={"DataTable with selectable rows"}>
                    <DataTable
                        data={data}
                        columns={columns}
                        onSelectRow={row =>
                            console.log("Do whatever you like with the selected row data", row)
                        }
                    />
                </StorySandbox>
                <StorySandbox title={"DataTable in loading state"}>
                    <DataTable data={data} columns={columns} loading={true} />
                </StorySandbox>
            </Story>
        );
    },
    {
        info: {
            propTables: [DataTable]
        }
    }
);
