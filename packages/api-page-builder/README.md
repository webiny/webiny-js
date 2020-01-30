# @webiny/api-page-builder
[![](https://img.shields.io/npm/dw/@webiny/api-page-builder.svg)](https://www.npmjs.com/package/@webiny/api-page-builder) 
[![](https://img.shields.io/npm/v/@webiny/api-page-builder.svg)](https://www.npmjs.com/package/@webiny/api-page-builder)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The API for the [Webiny Page Builder (@webiny/app-page-builder)](../app-page-builder) app. 
  
## Install
```
npm install --save @webiny/api-page-builder
```

Or if you prefer yarn: 
```
yarn add @webiny/api-page-builder
```

## For developers

### Page Builder Installation Files
This package must be deployed via the `@webiny/serverless-page-builder` component, because the Page Builder installation process relies on the installation ZIP file that will be upladed by the component. This ZIP file is located at `components/serverless-page-builder/installation/page_builder_installation_files.zip`.

#### page_builder_installation_files.zip

This file contains initial database data and phyiscal files - images, used on initial pages and page elements. Once unzipped, you will get the following folder structure:

```
├── data
└── images
    ├── elements
    │   └── images
    └── pages
        └── images
```

In the `data` folder, you will find JSON files, which represent initial data that will be inserted into the database in the Page Builder installation process (pages, page elements, categories and menus).

The `images` folder contains all of the images.
