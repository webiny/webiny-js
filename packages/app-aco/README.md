# @webiny/app-aco
[![](https://img.shields.io/npm/dw/@webiny/app-aco.svg)](https://www.npmjs.com/package/@webiny/app-aco) 
[![](https://img.shields.io/npm/v/@webiny/app-aco.svg)](https://www.npmjs.com/package/@webiny/app-aco)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of frontend aco-related utilities.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Reference](#reference)
    - [Components](#components)
        - [`ACOProvider`](#ACOProvider)
        - [`FolderTree`](#FolderTree)
        - [`EntryDialogMove`](#EntryDialogMove)
        - [`FolderDialogCreate`](#FolderDialogCreate)
        - [`FolderDialogDelete`](#FolderDialogDelete)
        - [`FolderDialogUpdate`](#FolderDialogUpdate)
    - [Hooks](#hooks)
        - [`useFolder`](#useFolders)
        - [`useRecords`](#useRecords)

## Installation
```
npm install --save @webiny/app-aco
```

Or if you prefer yarn: 
```
yarn add @webiny/app-aco
```

## Overview
The `@webiny/app-aco` package contains essential aco-related utilities (Advanced Content Organisation), that can be used within a React app. These include the `FoldersProvider` provider component, the `useFolders` and `useRecords` hooks, which can be used to retrieve the current folder and search record information and interact with them.

> ℹ️ **INFO**
>
> Internally, the [`FoldersProvider`](#FoldersProvider) provider retrieves information from the Webiny's default GraphQL API. Because of this, note that this project relies on [`@webiny/api-aco`](./../api-aco) when it comes to retrieving folders and records information (via GraphQL).

## Reference

### Components

#### `ACOProvider`

<details>
<summary>Type Declaration</summary>
<p>

```tsx
export declare const ACOProvider: React.ComponentType;
```

</p>
</details>

The [`ACOProvider`](#ACOProvider) is a provider component, which retrieves the folders and records information. The component also makes it possible to use the [`useFolders`](#useFolders) and [`useRecords`](#useRecords) hook, which can be used to list, create, update or delete folders and records within the React app.

```tsx
import React from "react";
import { ACOProvider } from "@webiny/app-aco";

export const App = () => {
  return (
    <ACOProvider>
      <MyApp />
    </ACOProvider>
  );
};
```

#### `FolderTree`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { NodeModel } from "@minoru/react-dnd-treeview";
import { DndItemData } from "~/types";

interface Props {
    type: string;
    title: string;
    enableCreate?: boolean;
    enableActions?: boolean;
    focusedFolderId?: string;
    hiddenFolderId?: string;
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    onTitleClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

declare function FolderTree(props: Props): React.ComponentType;
```
</p>
</details>

`FolderTree` component shows the tree list of folders for a particular `type`.

```tsx
import React from "react";
import { FolderTree } from "@webiny/app-aco";

export const MyComponent = () => {
    return (
        <FolderTree
            type={"page"}
            title={"All pages"}
            enableCreate={true}
            enableActions={true}
            focusedFolderId={"anyExistingId"}
            hiddenFolderId={"folderIdToHide"}
            onFolderClick={item => console.log(item)}
            onTitleClick={() => console.log("Do whatever you like on title click")}
        />
    );
};
```
> ℹ️ **INFO**
>
> Internally, the `FolderTree` uses [react-dnd-treeview](https://www.npmjs.com/package/@minoru/react-dnd-treeview) to render and manage the folder list: DO NOT rely on any of this package features, we might change it in the future.

#### `EntryDialogMove`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { DialogOnClose } from "@webiny/ui/Dialog";
import { SearchRecordItem } from "@webiny/app-aco";

interface Props {
    type: string;
    searchRecord: SearchRecordItem;
    open: boolean;
    onClose: DialogOnClose;
}

declare function EntryDialogMove(props: Props): React.ComponentType;
```
</p>
</details>

`EntryDialogMove` component shows a dialog to allow users to move a search record into a folder.

```tsx
import React, { useState } from "react";
import { EntryDialogMove } from "@webiny/app-aco";

type Props = {
    searchRecord: SearchRecordItem;
}

export const MyComponent = ({ searchRecord }: Props) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setDialogOpen(true)}>Edit folder</button>
            <EntryDialogMove
                type={"anyType"}
                searchRecord={searchRecord}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </>
    );
};
```

#### `FolderDialogCreate`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { DialogOnClose } from "@webiny/ui/Dialog";

interface Props {
    type: string;
    open: boolean;
    onClose: DialogOnClose;
    currentParentId?: string | null;
}

declare function FolderDialogCreate(props: Props): React.ComponentType;
```
</p>
</details>

`FolderDialogCreate` component shows a dialog to allow users to create a new folder.

```tsx
import React, { useState } from "react";
import { FolderDialogCreate } from "@webiny/app-aco";

export const MyComponent = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setDialogOpen(true)}>Create folder</button>
            <FolderDialogCreate
                type={"page"}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                currentParentId={"anyParentId"}
            />
        </>
    );
};
```
#### `FolderDialogDelete`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { DialogOnClose } from "@webiny/ui/Dialog";

interface Props {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
}

declare function FolderDialogDelete(props: Props): React.ComponentType;
```
</p>
</details>

`FolderDialogDelete` component shows a dialog to allow users to delete an existing folder.

```tsx
import React, { useState } from "react";
import { FolderDialogDelete } from "@webiny/app-aco";

type Props = {
    folder: FolderItem;
}

export const MyComponent = ({ folder }: Props) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setDialogOpen(true)}>Delete folder</button>
            <FolderDialogDelete
                folder={folder}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </>
    );
};
```

#### `FolderDialogUpdate`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { DialogOnClose } from "@webiny/ui/Dialog";

interface Props {
    folder: FolderItem;
    open: boolean;
    onClose: DialogOnClose;
}

declare function FolderDialogUpdate(props: Props): React.ComponentType;
```
</p>
</details>

`FolderDialogUpdate` component shows a dialog to allow users to update an existing folder.

```tsx
import React, { useState } from "react";
import { FolderDialogUpdate } from "@webiny/app-aco";

type Props = {
    folder: FolderItem;
}

export const MyComponent = ({ folder }: Props) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setDialogOpen(true)}>Edit folder</button>
            <FolderDialogUpdate
                folder={folder}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </>
    );
};
```

### Hooks
#### `useFolders`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import {FolderItem, FoldersActions} from "./types";

interface UseFoldersHook {
    folders: FolderItem[];
    loading: Record<FoldersActions, boolean>;
    getFolder: (id: string) => Promise<FolderItem>;
    createFolder: (folder: Omit<FolderItem, "id">) => Promise<FolderItem>;
    updateFolder: (folder: FolderItem) => Promise<FolderItem>;
    deleteFolder(folder: FolderItem): Promise<true>;
}

export declare function useFolders(type: string): UseFoldersHook;
```

</p>
</details>

`useFolders` hook allows you to interact with folders state and related APIs while building your custom component.

```tsx
import React from "react";
import { useFolders } from "@webiny/app-aco";

export const MyComponent = () => {
    const { folders } = useFolders("page");
    
    if (folders) {
        return folders.map(folder => {
            return <span key={folder.id}>{folder.name}</span>;
        });
    }
    
    return <span>No folders to show</span>;
};
```

As you might notice, there is not `listFolders` method available from `useFolders()` hook: this is because on first mount, `listFolders` is called internally, which will either issue a network request, or load folders from cache.

You don't need to store the result of it to any local state; that is managed by the context provider.

#### `useRecords`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { SearchRecordItem, Loading, LoadingActions, ListMeta } from "./types";

interface UseRecordsHook {
    records: SearchRecordItem[];
    loading: Loading<LoadingActions>;
    meta: Meta<ListMeta>;
    listRecords: (params: {
        type?: string;
        folderId?: string;
        limit?: number;
        after?: string;
        sort?: ListSort;
    }) => Promise<SearchRecordItem[]>;
    getRecord: (id: string) => Promise<SearchRecordItem>;
    createRecord: (record: Omit<SearchRecordItem, "id">) => Promise<SearchRecordItem>;
    updateRecord: (record: SearchRecordItem, contextFolderId?: string) => Promise<SearchRecordItem>;
    deleteRecord(record: SearchRecordItem): Promise<true>;
}

export declare function useRecords(type: string, folderId: string): UseRecordsHook;
```
</p>
</details>


`useRecords()` hook allows you to interact with search records state and related APIs while building your custom component.

```tsx
import React, { useEffect, useState } from "react";
import { useRecords } from "@webiny/app-aco";

import { getEntryDetails } from "./any-custom-hook"

export const MyComponent = () => {
    const { records } = useRecords("anyType", "anyFolderId");
    const [entries, setEntries] = useState([]);
    
    useEffect(() => {
        const details = getEntryDetails(records);
        setEntries(details)
    }, [records])
    
    if (entries) {
        return entries.map(entry => {
            return <span key={entry.id}>{entry.title}</span>;
        });
    }
    
    return <span>No entries to show</span>;
};
```

You don't need to store the result of it to any local state; that is managed by the context provider.
