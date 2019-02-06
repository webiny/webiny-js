# Webiny CLI
A tool to bootstrap a blank Webiny project.
Visit https://www.webiny.com to find out more about Webiny.

## How to use?
Create a folder for your project and install webiny-cli as a regular dev dependency.
```
// Create an empty project folder
mkdir my-project
cd my-project

// Initialize your project to create package.json
yarn init -y

// For per-project installation (recommended)
yarn add webiny-cli --dev
npx webiny init

// For global installations
yarn global add webiny-cli
webiny init
```

This will setup the entire project in form of a monorepo for easier project maintenance.

## How to run development builds?
Each app requires its own build process (just like any create-react-app project).
Open a terminal window, navigate to your app root and run `yarn start`:

```
// To start development build of your admin app
cd packages/admin
yarn start

// To start development build of your site app
cd packages/site
yarn start

// To start development build of your API
cd packages/api
yarn start
```


## Deploying your project to the Webiny Cloud
From the root of your project:
```
// To deploy everything
webiny deploy

// To deploy a particular app/api
webiny deploy packages/admin
```