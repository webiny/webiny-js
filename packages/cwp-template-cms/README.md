<p align="center">
  <img src="./static/webiny-logo.svg" width="250">
  <br><br>
  <strong>The Easiest Way to Adopt Serverless</strong>
</p>
<p align="center">
  <a href="https://www.webiny.com">Official Website</a> |
  <a href="https://docs.webiny.com">Docs</a>
</p>

#

## Getting started

To get started with Webiny, simply [follow this link](https://docs.webiny.com) 🚀

## CMS-Template!

This template comes loaded with cms and admin apps that webiny provides. It contains functionalities mentioned below:
* [Admin app](https://docs.webiny.com/docs/webiny-apps/admin/introduction): Users, Roles and Groups management system.
* [File manager](https://docs.webiny.com/docs/webiny-apps/file-manager/getting-started): It manages all file system in your cloud, whether you want to upload a new file, select an existing file.
* [Headless CMS](https://docs.webiny.com/docs/webiny-apps/headless-cms/features/content-modeling): It comes with content modeling, grouping, localization and many more. It also include a garphql playground so you can use to test and debug your API calls.
* [Security](https://docs.webiny.com/docs/webiny-apps/security/introduction): We have taken care of the security aspect as well. This module include the security measures which include roles and group configurations to keep things tight and have a proper access defined to each user.
* [I18N](https://docs.webiny.com/docs/webiny-apps/i18n/introduction):The I18N app is one of the core Webiny apps that lets you introduce multi-language support for your apps.

All these functionality comes under one hood. And you can always customize the application as the application is totally pluggin based, you can easily override, upgrade and tweak the app to suite your requirements. To customize the app use this [guide](https://docs.webiny.com).

### Install
To install/use the template type:
```
npx create-webiny-project <your-project-name> --template=cms
```

The process can take upto 10-15 min(depending on internet connection) to create the apps with all the dependencies.

### Project-Setup
After you have successfully created the admin app, you need to follow the below steps to setup and deploy the app to cloud. You can also refer to [webiny documents](http://docs.webiny.com/docs/get-started/quick-start).
* Make sure you have setup you [aws credentials](http://docs.webiny.com/docs/guides/aws-credentials).
* Make sure you have [mongodb](http://docs.webiny.com/docs/guides/mongodb-atlas) credentials ready.
1. Go into the **project directory**. ( cd *your project*)
2. Update the **MongoDB** server variable. (update MONGODB_SERVER with you connection string)
3. Run deployment command. ``` yarn webiny deploy api --env=local ``` (to deploy on different environment replace local with your environment i.e. dev, prod etc)

Now you have your project deployed and ready.
To run the project simply go into **apps/admin** and run **yarn start**.
This will start your app at localhost:3001.
To run the site simply go into **apps/site** and run **yarn start**.
This will start your site at localhost:3000.

Have fun 🚀.