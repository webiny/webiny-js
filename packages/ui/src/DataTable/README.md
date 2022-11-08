# DataTable

### Design

https://material.io/components/data-tables

### Description

Use `DataTable` components to display sets of data across rows and columns.

### Usage

```tsx
import { DataTable, Columns } from "@webiny/ui/DataTable";

// Declare the data structure.
interface Entry {
    name: string;
    createdBy: string;
    lastModified: string;
    status: string;
}

// Define the data you want to display.
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

// Define the columns structure for your table.
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

...

// Use the <DataTable /> component within your code.
return(
    <DataTable data={data} columns={columns} />
)
```
