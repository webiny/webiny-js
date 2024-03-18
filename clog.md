## Changes

This PR introduces multiple changes that improve UX of Webiny and `create-webiny-project` CLIs. In the following
section, we outline all the changes we made.

Changes are listed in no particular order.

## `create-webiny-project`

The following list of changes are all related to our `create-webiny-project` CLI, used for creating new Webiny projects.

#### 1. Offer Users To Immediately Deploy the Newly Created Project

Once the initial project creation has been done, users are immediately asked if they want to proceed with the initial deployment.

![image](https://github.com/webiny/webiny-js/assets/5121148/2d098bfa-0959-47c1-b4c5-2d40507465e2)

#### 2. Yarn Logs Shown Only In Case of an Error
When packages are installed, users are no longer bombarded by Yarn logs. Instead, a simple spinner is shown, and the logs are shown only in case of an error.

![image](https://github.com/webiny/webiny-js/assets/5121148/71b4cec8-e564-4534-9523-b3905a5ee43c)

#### 3. Graceful Error Handling

Although we haven't implemented any graceful error handling yet (because of the lack of errors in our analytics), there's now a way to do it (by throwing an instance of the new `GracefulError` class.

#### 4. Separate Tracking of Error and Graceful Error Events
We now separately track error and graceful error events. Basically, if an instance of a `GracefulError` class was thrown, a `create-webiny-project-error-graceful` event will be sent to our analytics. Otherwise, the usual `create-webiny-project-error` event gets sent.

#### 5. Full Logs Sent In Analytics
Prior to this PR, in case of an error, in our analytics, we'd only have very basic error information, not containing any details on why the error actually happened. This has now been addressed.

Having more information in our analytics will enable us to better detect what's bothering users and address those obstacles.

#### 6. Error Log File Contains More Info
The `create-webiny-project-logs.txt` file that gets created in case an error has occurred during the initial project creation now contains all the logs that were printed in user's terminal. Previously, similarly to 5., the file would only contain basic information.

#### 7. Catch `.gitignore` Commit Errors
Prior to this PR, even if the user had `git` set up, if the initial commit of the `.gitignore` file failed, the whole project creation would fail. This looks like a trivial error and something that should not definitely break the whole project creation process.

#### 8. `create-webiny-project-end` Event Being Sent In Case Of An Error
Prior to this PR, the `create-webiny-project-end` would be sent even in case of an error. This is not the expected logic.  The `create-webiny-project-end` must be sent only in case the project creation was successful.

#### 9. Restricting Users to Node18/Node20
Users won't be able to install Webiny in case their Webiny version is different from 18 or 20. We've decided to go with a bit harder version limiting just because we've seen users experiencing issues with newer version 21 of Node.

By further forcing specific Node versions, we're minimizing the possibility of unexpected issues for users.

Note 1: We'll add more versions as we start supporting more.
Note 2: The new limitations are also reflected in our docs. We'll be released with the 5.40.0 release.

## Webiny CLI

The following list of changes are all related to our Webiny CLI.

#### 1. Pulumi Output Hidden By Default

From now on, Pulumi deployment logs are hidden by default. The only thing that the user will see is the "Deploying..." spinner and that's it.

![image](https://github.com/webiny/webiny-js/assets/5121148/054b3318-4969-416c-be04-2958061e4d9b)

A couple of notes.

1. The logs can of course be enabled, by providing `--deployment-logs` flag.
2. In case of an error, deployment logs will be shown, no matter if the `--deployment-logs` has been passed or not.
3. For cases where the deployment lasts more than 10 minutes, we've made sure the messages are changing over time:

```
const spinnerMessages = [
    [60, "Still deploying..."],
    [120, "Still deploying, please wait..."],
    [180, "Some resources take some time to become ready, please wait..."],

    [270, "Still deploying, please don't interrupt..."],
    [360, "Still deploying, please be patient..."],
    [450, "Still deploying, please don't interrupt..."],
    [540, "Still deploying, please be patient..."],

    [600, "Deploying for 10 minutes now, probably a couple more to go..."],
    [720, "Still deploying, shouldn't be much longer now..."],

    [840, "Looks like it's taking a bit longer than usual, please wait..."],
    [900, "Deploying for 15 minutes now, hopefully it's almost done..."],

    [1200, "Deploying for 20 minutes now, hopefully it's almost done..."]
];
```

#### 2. Refactor - Multiple `BasePackageBuilder` Classes

We've refactored internal code dealing with building of packages. Basically, instead of having everything in a single file, we've divided the code into a couple of classes.

##### Bonus: Simplified `worker.js` Code

The `worker.js` file, whose code is responsible for calling the package's build script has also been simplified. In the file, we're no longer overriding `console` object's methods. Now, we're simply intercepting `process.stdout.write` and `process.stderr.write` calls, where we store all messages into local variables, and then ensuring those get included when responding back to the main process.

This makes it easier to deal with output produced within worker threads / subprocesses, and making sure the whole output is being received by the main process.

#### 3. Lazy-import Modules By Calling `require` Inside Functions
In a couple of places, I've moved the `require` calls inside a function. This ensures the required modules are not immediately loaded, but only when actually needed (lazy loaded).

Was hoping this would speed up our CLI a bit, but did not see any visible performance improvements. 🙁

#### 4. Graceful Error Handling

We've added the ability to gracefully handl errors (similarly to the graceful error handling we've added in the `create-webiny-project` CLI).

Right now, we've only gracefully handling two deployments-related errors, but over time, we can add more.

For example, in case of a pending Pulumi operation, users will receive a more friendly error message, as visible in the screenshot:
![image](https://github.com/webiny/webiny-js/assets/5121148/93153f61-ead9-48e5-a6ce-c040cb0054c4)

#### 5. Improved Analytics

Analytics has been improved. We've added the following.

1. From now on, deployment errors that user experience will also be included in analytics events. This will help us with  improving the stability, by detecting what errors are users often experiencing and then gracefully handling them. Prior to this PR, the only piece of info that we had was essentially "command failed", which doesn't help.

2. We've added the `newUser` flag when sending analytics events. The `newUser` flag remains `true`, until a user manages to fully deploy a Webiny instance on their machine. Once that's done, the `newUser` flag remains `false` forever.

3. We've added the new `ci` flag when sending analytics events. This will enable us to group events by those sent from a developer's machine and events sent from a CI/CD provider.

4. When deploying the project in full (via `yarn webiny deploy`), in case an instance of `GracefulError` was thrown, the `cli-project-deploy-error-graceful` will be sent to our analytics. In other cases, the usual `cli-project-deploy-error` event will be sent.

5. When deploying apps separately, e.g. `yarn webiny deploy api --env dev`, a new `pulumi-command-deploy-start` event is sent. Like with the existing `cli-project-deploy` events, the `cli-project-deploy-end` is sent when a command has successfully been completed, and `cli-project-deploy-error` / `cli-project-deploy-error-graceful` when a command has errored.

#### 6. Build/Watch Packages - Only Using Worker Threads When Needed
The `build` and `watch` commands distribute multiple package build/watch processes across multiple Node worker threads.

Prior to this PR, this was done even when only one package needed to be built/watched, which, in fact, is not required. From now on, if a single package is to be built/watched, worker threads are not used. The build/watch is happening in the same process in which Webiny CLI was invoked.

This makes it a lot easier to print out original logs from build tools like Webpack. Ultimately, this enabled us to have the default Webpack ([webpackbar](https://github.com/unjs/webpackbar)) logs printed to the user, making the DX a bit more pleasant than what it used to be.

Building GraphQL API application code:
![image](https://github.com/webiny/webiny-js/assets/5121148/17442fa8-b0a0-4d95-b89a-485c0487ff43)

![image](https://github.com/webiny/webiny-js/assets/5121148/90e78599-ddbc-4d07-a598-c3fb39526cb6)

Building Admin application code:
![image](https://github.com/webiny/webiny-js/assets/5121148/d4501328-032c-432a-88e7-4e1ef320d9b7)

#### 7. Improved Multiple Packages Build Output
As mentioned above, we can now finally have the default Webpack output in terminal. But what about multiple packages?

Here we've also done some improvements. When multiple packages are being built, we're now using the Listr library to show a nice list of packages that are being built.

![image](https://github.com/webiny/webiny-js/assets/5121148/fc98cbd7-57f2-4136-a792-f7c8b598b45d)

#### 8. Removed Pre-5.29-related Code
In the code, there were still a couple of checks related to pre-5.29 Webiny versions. These checks are no longer needed, and have been removed.

#### 9. Deploy Lifecycle Events Class Plugins

Prior to this PR, hooking into deploy-related lifecycle events was done via a simple JS object-style plugin:

```javascript
 {
    type: "hook-before-deploy",
    name: "hook-before-deploy-aws-credentials",
    async hook() {
        // ...
    }
};
```

This can now be done with dedicated classes:

```
AfterBuildPlugin                        
BeforeBuildPlugin                       
BeforeDeployPlugin
AfterDeployPlugin                       
```

For example:

```javascript
import { BeforeDeployPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";

export const ensureCoreDeployed = new BeforeDeployPlugin((params, ctx) => {
    //
});

ensureCoreDeployed.name = "api.before-deploy.ensure-core-deployed";
```

#### 10. Improved `webiny deploy` output
On top of everything that's already mentioned in other points, a couple of extra improvements were done to the `webiny deploy` command.

1. Separate deploy commands are no longer called via `execa` and calling `yarn webiny deploy ...`, but directly. Makes things a bit more stable / faster.
2. Fixed some inconsistencies in different parts of the process.
3. At the end of the command, the `Project Details` section is now always printed. This way the user does not have to run the `webiny info` command (check the next section for updates on that one).

![image](https://github.com/webiny/webiny-js/assets/5121148/47838ca9-a399-44dc-b4d7-1879b1535205)

#### 11. Refreshed `webiny info` Command

The `webiny info` command has been visually refreshed a bit.

![image](https://github.com/webiny/webiny-js/assets/5121148/dbba10a7-034e-4df1-bb3c-1f51c92dade2)

Note that the command is now also called internally at the end of the full project deployment (via `webiny deploy`). In other words, at the end of the full project deployment, users will see the same project information, in the same format as if they manually called `webiny info`.

#### 12. Improved `webiny about` Command Output

The `webiny about` command now also shows the following:
1. the database setup the project is using
6. user's current version of NPM.
7. whether the command was run in a CI/CD environment

![image](https://github.com/webiny/webiny-js/assets/5121148/af500cd7-61b8-4e93-8d0c-943f0343b342)

#### 13. Added `ProjectApplication` Interface
I've created the [`ProjectApplication`](https://github.com/webiny/webiny-js/blob/adrian/cwp-cli-ux-improvements-merged-next/packages/cli/types.d.ts#L44-L95) TS interface. Needed it mainly so that the DX is better when using the new CLI lifecycle event classes.

#### 14. Open Admin App Automatically On First Deploy
Once the initial full project deployment is done (via `webiny deploy`), the CLI will try to immediately open the Admin app in user's default browser. Below are the two images that show how it looks.

![Snipaste_2024-03-18_18-41-15](https://github.com/webiny/webiny-js/assets/5121148/cd709f0c-a047-4a09-86c9-78a316187c72)

![Snipaste_2024-03-18_18-41-34](https://github.com/webiny/webiny-js/assets/5121148/fd744d6b-0e23-4340-b64f-ed42f477bf8a)

#### 15. Build Errors Printed Two Times (Frontend Apps)

Prior to this PR, if an error occurred while building a frontend app, the error would be printed twice.

![image](https://github.com/webiny/webiny-js/assets/5121148/145d1ebc-8c6e-4550-b1a0-d2f2b0ee7e88)

This is no longer the case.

#### 16. Throw Friendly Messages When Deploying API, but not Core / Admin but not API
We've added checks that ensure API app cannot be deployed if Core wasn't deployed. The same goes with Admin: the app cannot be deployed if API wasn't deployed yet.

![image](https://github.com/webiny/webiny-js/assets/5121148/d827e64e-ab05-4b2c-b2e3-afaf24ea385f)

#### 17. Deployment - Nicer Durations
Prior to this PR, durations would be printed in seconds, making them hard to read (e.g., a deployment finished in 654.542 seconds).

This is no longer the case. From now on, durations will be printed in minutes/seconds. For example:

![Snipaste_2024-03-18_17-12-36](https://github.com/webiny/webiny-js/assets/5121148/5dd12211-2276-417c-a253-efa9248a80d8)

### Other

#### 1. Using `wts` Package For Telemetry
Prior to this PR, we've been issuing events to `t.webiny.com` via our own implementation (`node-fetch` basically. With this PR, we've switched to using `wts`. An interesting side effect is that some code has been simplified, for example the old `setProperties` function no longer exists, everything is done via a single `sendEvent` function call.

#### 2. Refactored Telemetry Package Code
Apart from the `wts` package mentioned above, we've also refactored existing telemetry package code.

#### 3. Remove `pbLegacyRenderingEngine` Leftovers
A couple of occurrences of the `pbLegacyRenderingEngine` deploy hook plugin have been left hanging in the codebase. Those are no longer needed, so they have been fully cleaned up.

#### 4. WCP Badge In Admin App
When a Webiny project has been linked with WCP, in the Admin app, a small `WCP` badge will appear in the main menu, at the very bottom, where the Webiny version is printed.

![image](https://github.com/webiny/webiny-js/assets/5121148/c008cced-cec5-4f6b-86bd-8f478b0ce013)

## How Has This Been Tested?

Manual.

## Documentation

Changelog.
