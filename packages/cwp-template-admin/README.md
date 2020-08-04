<p align="center">
  <img src="../../static/webiny-logo.svg" width="250">
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

## Admin-Template!

As the name suggest this template include all functionality of an admin app. It creates an application that 
will manage users (i.e. create, update, remove, list etc), allows you to define and assign roles and groups for different users. To faciliate users it comes with few predefined generally used user roles as well. The application also comes with a language support.

You can always customize the application as the application is totally pluggin based, you can easily override, upgrade and tweak the app to suite your requirements. To customize the app use this [guide](https://docs.webiny.com).

The template handles resource deployment of resources to cloud platform (for now only AWS). The deployment process will consume: cognito, aws lambda, api gateways, s3 bucket and cloudfront. The deployment process is currently wrapped into different packages made via AWS SDK.
 

### GraphQL API

Our API layer works as a collection of Lambda functions with [Apollo Federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/) handling all the GraphQL-related stuff. But it is not limited to just GraphQL. It's also easy to add REST APIs, or simple Lambda functions for simple data fetching or background processing.

### Install
To install/use the template type:
```
npx create-webiny-project <your-project-name> --template=admin
```

this would create the admin-app and will also provide instruction that are to be followed to setup and deploy the app.

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

Have fun 🚀.