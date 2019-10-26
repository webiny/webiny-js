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

There are 3 key folders: `api`, `apps` and `packages`.

### `api`
This is where your API configuration resides. It contains a single `serverless.yml` file and an environment configuration file. `Where is the code?` you might ask. There is none! :D Joking of course - there is! But it is handled by our serverless components and you can find them in your `node_modules/@webiny` folder. All the component packages have a `serverless-` prefix. More about serverless components can be found [here](https://github.com/serverless/components/).

> IMPORTANT: Don't try to run your serverless.yml with the serverless CLI - it won't work.

`.env.json` contains all your environments and you're free to add as many as you need. Environment configuration is managed by [env-cmd](https://www.npmjs.com/package/env-cmd) package.

API is deployed using the Webiny CLI. Running `webiny deploy-api --env=dev` will load the `default` and `dev` environment config blocks from `.env.json`, inject it into `serverless.yml` and start the deploy process.
`default` environment is always loaded first, so you can add your shared variables there.

### `apps`
This folder contains your React apps. The `admin` and `site` apps are regular `create-react-app`s. However, to make them a little more configurable, we use [rescripts](https://github.com/harrysolovay/rescripts). This allows us to configure `react-scripts` without [ejecting](https://create-react-app.dev/docs/available-scripts#npm-run-eject). 

All of our opinionated helpers and configs are located in your project, in `packages/project-utils`. You're free to tweak these tools if required, but the base setup is what we think to be a solid configuration to develop your Webiny project in a monorepo (since `react-scripts` do not support monorepo at this point). Find more about `project-utils` in a dedicated chapter below.

### `packages`
This folder is a good place to put all the packages you develop. There is nothing special about it, it is simply there for you to use. There are already 2 helper packages that are not an app of their own: `theme` and `project-utils`, but our apps do rely on them.

## Webiny CLI
Our CLI is the main tool to interact with your Webiny project. We'll be adding more tools to it as we move forward.

To see all the available CLI commands, run `webiny --help`. Most of those commands should be executed from the root of your project. The CLI is equipped with tools to deploy and remove your API and apps. It also helps you connect your API with your apps by updating `.env.json` files whenever you deploy an API (so you don't have to think about it and do it by hand). We call them `hooks`, and those hooks are also in your project and under your control; find them in `webiny.js` file in the root of your React apps.

As we get user's feedback, wishes and see a good fit for another hook, we'll add support for more of them.

There is also a `webiny.js` file in the root of your project. It simply give us the location of each app so we can load and execute hooks. If you add another app, make sure you also add it to the `webiny.js` so we can handle `env.json` updates for you.

## Customization
If you need to add/remove/rename or completely rearrange the project - you only need to keep the `api` and `apps` folders as those are reserved names which our CLI depends on.

In `package.json` you will find the `workspaces` section which defines which folders are considered to be a workspace. You can easily add new workspaces there. Once you modify the `workspaces` section, make sure you run `yarn` in the root of the project.

## Why `yarn` and not `npm`?
`yarn` has built-in support for workspaces, `npm` doesn't. `yarn` also has a great mechanism that hoists your dependencies thus reducing the amount of package clones in your project. If you'd rather use `lerna` instead of `yarn`, you'll have to also tweak the `project-utils` as we rely on `get-yarn-workspaces` package to load monorepo workspaces. If you embark on that journey, please let us know how things go. We'd love to hear success stories with different setups!

## `project-utils`
So what does this package have to do with anything?

If you've ever created a project using `create-react-app` you know its config is hidden from you unless you [eject](https://create-react-app.dev/docs/available-scripts#npm-run-eject), which isn't really a good option because you won't receive any new updates they ship for `react-scripts`. Besides, `react-sripts` does not support monorepos. So the good people at [rescripts](https://github.com/harrysolovay/rescripts) created this tool to override `react-scripts` without ejecting 🎉 .

In each of your React apps you will find a `.babelrc.js`, which loads babel config from `@webiny/project-utils/app-babel` and also a `.rescriptsrc.js` which loads a Webiny rescript from `@webiny/project-utils/cra` (you can add more rescripts here if you like).

When running a build of your React app, we run `rescripts` (see `package.json` scripts), which intercepts the webpack config generated by `react-scripts` and allow you to modify it. In our rescript we enable `babelrc` files and also assign `babelrcRoots` so all the packages in your monorepo are accessible from your React app. Also, since we enable `babelrc`, each of your packages are now transpiled using their own `.babelrc` file so they become real standalone, self-contained packages ready to be built and  published to `npm` if you choose to.

A quick overview of tools included in this package:

- `aliases` - loads monorepo packages and creates aliases for babel, eg: `theme` => `theme/src`, so you can develop in your `src` folder but wherever you import the `theme` it will point to `theme/src`. This greatly increases development speed as no extra watching/building/copying is required. Your `webpack-dev-server` will pick up all the changes, transpile on-fly and you're good to go.
- `app-babel` - contains a babel config for React apps. It is opinionated, so you're welcome to change it as you see fit, just make sure your changes don't break your project :)
- `cra` - this is our [rescript](https://github.com/harrysolovay/rescripts#rescript-structure) to get a CRA app to work as we want it to. Again, tweak it to your heart's content :)
- `packages` - simply loads monorepo packages using `get-yarn-workspaces` package.

## Need more info?
📖 Visit our documentation at https://docs.webiny.com.

For questions, bugs, issues, feature requests, etc. head over to our Github at https://github.com/webiny/webiny-js and file an issue.

🏁 We hope you have a great time with Webiny and we can't wait to hear your feedback and suggestions! 
🚀 Happy coding!
