import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import type { DataTableColumns, DataTableDefaultData, DataTableSorting } from "./DataTable.js";
import { DataTable } from "./DataTable.js";
import { Avatar } from "~/Avatar/index.js";
import { Text } from "~/Text/index.js";

const meta: Meta<typeof DataTable> = {
    title: "Components/DataTable",
    component: DataTable,
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story<T extends Record<string, any> & DataTableDefaultData> = StoryObj<typeof DataTable<T>>;

// Declare the data structure.
interface Entry {
    id: string;
    name: string;
    createdBy: string;
    lastModified: string;
    status: string;
}

// Define the columns structure for the table.
const columns: DataTableColumns<Entry> = {
    name: {
        header: "Title"
    },
    createdBy: {
        header: "Author"
    },
    lastModified: {
        header: "Last Modified"
    },
    status: {
        header: "Status"
    }
};

// Define the data to display.
const data = [
    {
        id: "entry-1",
        name: "Getting Started Guide",
        createdBy: "John Doe",
        lastModified: "1 hour ago",
        status: "Published"
    },
    {
        id: "entry-2",
        name: "User Documentation",
        createdBy: "Jane Smith",
        lastModified: "3 days ago",
        status: "Draft"
    },
    {
        id: "entry-3",
        name: "API Reference",
        createdBy: "John Doe",
        lastModified: "1 week ago",
        status: "Published"
    }
];

export const Default: Story<Entry> = {
    args: {
        data,
        columns
    }
};

export const Bordered: Story<Entry> = {
    args: {
        ...Default.args,
        bordered: true
    }
};

export const WithStickyHeader: Story<Entry> = {
    args: {
        ...Default.args,
        stickyHeader: true
    }
};

export const WithSelectableRows: Story<Entry> = {
    args: Default.args,
    render: args => {
        const [selectedRows, setSelectedRows] = useState<Entry[]>([]);

        return (
            <DataTable
                {...args}
                selectedRows={selectedRows}
                onSelectRow={rows => setSelectedRows(rows)}
            />
        );
    }
};

export const WithLoading: Story<Entry> = {
    args: {
        columns
    },
    render: ({ columns }) => {
        const [loading, setLoading] = useState(true);
        const [tableData, setTableData] = useState<Entry[]>([]);

        useEffect(() => {
            const timer = setTimeout(() => {
                setTableData(data); // your predefined data
                setLoading(false);
            }, 5000);

            return () => clearTimeout(timer);
        }, []);

        return <DataTable columns={columns} data={tableData} loading={loading} />;
    }
};

export const WithLongColumnContent: Story<Entry> = {
    args: {
        ...Default.args,
        columns: {
            ...columns,
            name: {
                ...columns.name,
                header: "Name - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            }
        },
        data: data.map(entry => ({
            ...entry,
            name: `${entry.name} - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
        }))
    }
};

export const WithCustomCellRenderer: Story<Entry> = {
    args: {
        ...Default.args,
        columns: {
            ...columns,
            name: {
                ...columns.name,
                cell: (entry: Entry) => {
                    return (
                        <div className={"flex items-center gap-sm-extra"}>
                            <Avatar
                                image={
                                    <Avatar.Image
                                        src="https://github.com/webiny-bot.png"
                                        alt="@webiny"
                                    />
                                }
                                fallback={<Avatar.Fallback>{entry.name.charAt(0)}</Avatar.Fallback>}
                                size={"xl"}
                            />
                            <div>
                                <Text
                                    className={"text-neutral-primary font-semibold"}
                                    as={"div"}
                                >
                                    {entry.name}
                                </Text>
                                <Text
                                    size={"sm"}
                                    className={"text-neutral-strong"}
                                    as={"div"}
                                >{`Last updated: ${entry.lastModified}`}</Text>
                            </div>
                        </div>
                    );
                }
            }
        }
    }
};

export const WithCustomColumnSize: Story<Entry> = {
    args: {
        ...Default.args,
        columns: {
            ...columns,
            name: {
                ...columns.name,
                size: 200
            }
        }
    }
};

export const WithCustomColumnClassName: Story<Entry> = {
    args: {
        ...Default.args,
        columns: {
            ...columns,
            lastModified: {
                ...columns.lastModified,
                className: "bg-primary-subtle"
            },
            status: {
                ...columns.status,
                className: "text-right"
            }
        }
    }
};

export const WithSorting: Story<Entry> = {
    args: {
        ...Default.args,
        columns: {
            ...columns,
            name: {
                ...columns.name,
                enableSorting: true
            },
            lastModified: {
                ...columns.lastModified,
                enableSorting: true
            }
        },
        sorting: [
            {
                id: "lastModified",
                desc: true
            }
        ]
    },
    render: ({ sorting: argsSorting = [], ...args }) => {
        const [sorting, setSorting] = useState<DataTableSorting>(argsSorting);
        return <DataTable {...args} sorting={sorting} onSortingChange={setSorting} />;
    }
};

// Add a Documentation story
export const Documentation: Story<Entry> = {
    args: {
        bordered: true,
        stickyHeader: true,
        columns: {
            name: {
                header: "Title",
                enableSorting: true
            },
            createdBy: {
                header: "Author"
            },
            lastModified: {
                header: "Last Modified",
                enableSorting: true
            },
            status: {
                header: "Status"
            }
        },
        data: [
            {
                id: "entry-1",
                name: "Getting Started Guide",
                createdBy: "John Doe",
                lastModified: "1 hour ago",
                status: "Published"
            },
            {
                id: "entry-2",
                name: "User Documentation",
                createdBy: "Jane Smith",
                lastModified: "3 days ago",
                status: "Draft"
            },
            {
                id: "entry-3",
                name: "API Reference",
                createdBy: "John Doe",
                lastModified: "1 week ago",
                status: "Published"
            }
        ]
    },
    render: args => {
        const [selectedRows, setSelectedRows] = useState<Entry[]>([]);
        const [sorting, setSorting] = useState<DataTableSorting>([]);

        return (
            <DataTable
                {...args}
                selectedRows={selectedRows}
                onSelectRow={rows => setSelectedRows(rows)}
                sorting={sorting}
                onSortingChange={setSorting}
            />
        );
    },
    parameters: {
        docs: {
            description: {
                story: "This example shows a DataTable with selectable rows, sorting, and a sticky header."
            }
        }
    },
    argTypes: {
        bordered: {
            description: "Show or hide borders.",
            control: "boolean",
            defaultValue: true
        },
        stickyHeader: {
            description: "Enable sticky header.",
            control: "boolean",
            defaultValue: true
        },
        columns: {
            description: "Columns definition. Please refer to the code example for details.",
            control: false
        },
        data: {
            description:
                "Data to display into DataTable body. Please refer to the code example for details.",
            control: false
        }
    }
};
