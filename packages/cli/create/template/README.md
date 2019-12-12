<br/>
<p align="center">
  <img src="https://github.com/webiny/webiny-js/raw/development/static/webiny-logo.svg?sanitize=true" width="250" />
  <br/><br/>
  <strong>Developer-friendly Serverless CMS powered by GraphQL and React</strong>
</p>
<p align="center">
  <a href="https://www.webiny.com">Official Website</a> |
  <a href="https://docs.webiny.com/docs/developer-tutorials/local-setup">Docs</a> 
</p>

<p align="center">

## Project organization
Webiny project is a monorepo managed by `yarn`. Monorepos are a good way to manage your packages in a single repository. It's not a perfect solution to all your problems but for Webiny, we find it works very well.

There are 2 key folders: `api`, `apps`.

### `api`
This is where your API configuration resides. It contains a single `serverless.yml` file and an environment configuration file. `Where is the code?` you might ask. There is none! :D Joking of course - there is! But it is handled by our serverless components and you can find them in your `node_modules/@webiny` folder. All the component packages have a `serverless-` prefix. More about serverless components can be found [here](https://github.com/serverless/components/).

> IMPORTANT: Don't try to run your serverless.yml with the serverless CLI - it won't work.

`.env.json` contains all your environments and you're free to add as many as you need. Environment configuration is managed by [env-cmd](https://www.npmjs.com/package/env-cmd) package.

API is deployed using the Webiny CLI. Running `webiny deploy-api --env=dev` will load the `default` and `dev` environment config blocks from `.env.json`, inject it into `serverless.yml` and start the deploy process.
`default` environment is always loaded first, so you can add your shared variables there.

### `apps`
This folder contains your React apps. The `admin` and `site` apps are regular `create-react-app`s. However, to make them a little more configurable, we use [rescripts](https://github.com/harrysolovay/rescripts). This allows us to configure `react-scripts` without [ejecting](https://create-react-app.dev/docs/available-scripts#npm-run-eject). 

## Webiny CLI
Our CLI is the main tool to interact with your Webiny project. We'll be adding more tools to it as we move forward.

To see all the available CLI commands, run `webiny --help`. Most of those commands should be executed from the root of your project. The CLI is equipped with tools to deploy and remove your API and apps. It also helps you connect your API with your apps by updating `.env.json` files whenever you deploy an API (so you don't have to think about it and do it by hand). We call them `hooks`, and those hooks are also in your project and under your control; find them in `webiny.js` file in the root of your React apps.

As we get user's feedback, wishes and see a good fit for another hook, we'll add support for more of them.

There is also a `webiny.js` file in the root of your project. It simply give us the location of each app so we can load and execute hooks. If you add another app, make sure you also add it to the `webiny.js` so we can handle `env.json` updates for you.

## Customization
If you need to add/remove/rename or completely rearrange the project - you only need to keep the `api` and `apps` folders as those are reserved names which our CLI depends on.

In `package.json` you will find the `workspaces` section which defines which folders are considered to be a workspace. You can easily add new workspaces there. Once you modify the `workspaces` section, make sure you run `yarn` in the root of the project.

## Why `yarn` and not `npm`?
`yarn` has built-in support for workspaces, `npm` doesn't. `yarn` also has a great mechanism that hoists your dependencies thus reducing the amount of package clones in your project. If you'd rather use `lerna` instead of `yarn`, please let us know how things go. We'd love to hear success stories with different setups!

## Need more info?
📖 Visit our documentation at https://docs.webiny.com.

For questions, bugs, issues, feature requests, etc. head over to our Github at https://github.com/webiny/webiny-js and file an issue.

🏁 We hope you have a great time with Webiny and we can't wait to hear your feedback and suggestions! 
🚀 Happy coding!
