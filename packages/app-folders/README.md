# @webiny/app-folders
[![](https://img.shields.io/npm/dw/@webiny/app-folders.svg)](https://www.npmjs.com/package/@webiny/app-folders) 
[![](https://img.shields.io/npm/v/@webiny/app-folders.svg)](https://www.npmjs.com/package/@webiny/app-folders)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

An app to manage folder-related features. 

Use together with [@webiny/api-folders](../api-folders) package.

## Install
```
npm install --save @webiny/app-folders
```

Or if you prefer yarn: 
```
yarn add @webiny/app-folders
```

## Usage
Make sure `FoldersProvider` has been included within the admin app.

### FolderTree component
`FolderTree` component shows the tree list of folders for a particular `type`.


```jsx
import { FolderTree } from "@webiny/app-folders";

<FolderTree
    type={"page"}
    title={"All pages"}
    onFolderClick={item => console.log(item)}
    focusedFolderId={"anyExistingId"}
/>
```

### useFolder hook
`useFolder()` hook allows you to interact with folders state and related APIs while building your custom component.

```jsx
import { useFolders } from "@webiny/app-folders";

const { folders, loading, getFolder, createFolder, updateFolder, deleteFolder } = useFolders("page"); // IMPORTANT: pass the `type` of folder you want to interact with.
```

As you might notice, there is not `listFolders` method available from `useFolders()` hook: this is because on first mount, `listFolders` is called internally, which will either issue a network request, or load folders from cache.

You don't need to store the result of it to any local state; that is managed by the context provider.

### useFolderLinks hook
`useFolderLinks()` hook allows you to interact with folders links state and related APIs while building your custom component.

```jsx
import { useLinks } from "@webiny/app-folders";

const { links, loading, getLink, createLink, updateLink, deleteLink } = useLinks("anyFolderid"); // IMPORTANT: pass the `folderId` of links you want to interact with.
```

As you might notice, there is not `listLinks` method available from `useLinks()` hook: this is because on first mount, `listLinks` is called internally, which will either issue a network request, or load links from cache.

You don't need to store the result of it to any local state; that is managed by the context provider.
