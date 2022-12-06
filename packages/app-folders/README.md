# @webiny/app-folders
[![](https://img.shields.io/npm/dw/@webiny/app-folders.svg)](https://www.npmjs.com/package/@webiny/app-folders) 
[![](https://img.shields.io/npm/v/@webiny/app-folders.svg)](https://www.npmjs.com/package/@webiny/app-folders)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of frontend folders-related utilities.

## Table of Contents

- [Installation](#installation)
- [Overview](#overview)
- [Reference](#reference)
    - [Components](#components)
        - [`FoldersProvider`](#FoldersProvider)
        - [`FolderTree`](#FolderTree)
        - [`FolderDialogCreate`](#FolderDialogCreate)
        - [`FolderDialogUpdate`](#FolderDialogUpdate)
        - [`FolderDialogDelete`](#FolderDialogDelete)
    - [Hooks](#hooks)
        - [`useFolder`](#useFolders)
        - [`useLinks`](#useLinks)

## Installation
```
npm install --save @webiny/app-folders
```

Or if you prefer yarn: 
```
yarn add @webiny/app-folders
```

## Overview
The `@webiny/app-folders` package contains essential folders-related utilities (often referred as ACO - Advanced Content Organisation), that can be used within a React app. These include the `FoldersProvider` provider component, the `useFolders` and `useLinks` hooks, which can be used to retrieve the current folder and link information and interact with them.

> ℹ️ **INFO**
>
> Internally, the [`FoldersProvider`](#FoldersProvider) provider retrieves information from the Webiny's default GraphQL API. Because of this, note that this project relies on [`@webiny/api-folders`](./../api-folders) when it comes to retrieving folders and links information (via GraphQL).

## Reference

### Components

#### `FoldersProvider`

<details>
<summary>Type Declaration</summary>
<p>

```tsx
export declare const FoldersProvider: React.FC;
```

</p>
</details>

The [`FoldersProvider`](#FoldersProvider) is a provider component, which retrieves the folders and links information. The component also makes it possible to use the [`useFolders`](#useFolders) and [`useLinks`](#useLinks) hook, which can be used to list, create, update or delete folders and links within the React app.

```tsx
import React from "react";
import { FoldersProvider } from "@webiny/app-folders";

const App = () => {
  return (
    <FoldersProvider>
      <MyApp />
    </FoldersProvider>
  );
};

export const App;
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
    onFolderClick: (data: NodeModel<DndItemData>["data"]) => void;
    onTitleClick?: (event: React.MouseEvent<HTMLElement>) => void;
    focusedFolderId?: string;
}

declare function FolderTree(props: Props): React.FC;
```
</p>
</details>

`FolderTree` component shows the tree list of folders for a particular `type`.

```tsx
import React from "react";
import { FolderTree } from "@webiny/app-folders";

export const MyComponent = () => {
    return (
        <FolderTree
            type={"page"}
            title={"All pages"}
            onFolderClick={item => console.log(item)}
            onTitleClick={() => console.log("Do whatever you like on title click")}
            focusedFolderId={"anyExistingId"}
        />
    );
};
```
> ℹ️ **INFO**
>
> Internally, the `FolderTree` uses [react-dnd-treeview](https://www.npmjs.com/package/@minoru/react-dnd-treeview) to render and manage the folder list: DO NOT rely on any of this package features, we might change it in the future.

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
    parentId?: string | null;
}

declare function FolderDialogCreate(props: Props): React.FC;
```
</p>
</details>

`FolderDialogCreate` component shows a dialog to allow users to create a new folder.

```tsx
import React, { useState } from "react";
import { FolderDialogCreate } from "@webiny/app-folders";

export const MyComponent = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setDialogOpen(true)}>Create folder</button>
            <FolderDialogCreate
                type={"page"}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                parentId={"anyParentId"}
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

declare function FolderDialogUpdate(props: Props): React.FC;
```
</p>
</details>

`FolderDialogUpdate` component shows a dialog to allow users to update an existing folder.

```tsx
import React, { useState } from "react";
import { FolderDialogUpdate } from "@webiny/app-folders";

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

declare function FolderDialogDelete(props: Props): React.FC;
```
</p>
</details>

`FolderDialogDelete` component shows a dialog to allow users to delete an existing folder.

```tsx
import React, { useState } from "react";
import { FolderDialogDelete } from "@webiny/app-folders";

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
import { useFolders } from "@webiny/app-folders";

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

#### `useLinks`
<details>
<summary>Type Declaration</summary>
<p>

```tsx
import { LinkItem, LinksActions } from "./types";

interface UseLinksHook {
    links: LinkItem[];
    loading: Record<LinksActions, boolean>;
    getLink: (id: string, folderId: string) => Promise<LinkItem>;
    createLink: (link: Omit<LinkItem, "linkId">) => Promise<LinkItem>;
    updateLink: (link: LinkItem, contextFolderId: string) => Promise<LinkItem>;
    deleteLink(link: LinkItem): Promise<true>;
}

export declare function useLinks(folderId: string): UseLinksHook;
```
</p>
</details>


`useLinks()` hook allows you to interact with folders links state and related APIs while building your custom component.

```tsx
import React, { useEffect, useState } from "react";
import { useLinks } from "@webiny/app-folders";

import { getEntryDetails } from "./any-custom-hook"

export const MyComponent = () => {
    const { links } = useLinks("anyFolderId");
    const [entries, setEntries] = useState([]);
    
    useEffect(() => {
        const details = getEntryDetails(links);
        setEntries(details)
    }, [links])
    
    if (entries) {
        return entries.map(entry => {
            return <span key={entry.id}>{entry.name}</span>;
        });
    }
    
    return <span>No entries to show</span>;
};
```

As you might notice, there is not `listLinks` method available from `useLinks()` hook: this is because on first mount, `listLinks` is called internally, which will either issue a network request, or load links from cache.

You don't need to store the result of it to any local state; that is managed by the context provider.
