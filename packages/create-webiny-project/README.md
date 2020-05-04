Here are some notes on some Gotcha's that may happen:

Local dev gotchas:

#1: How to run `create-webiny-project`

Head to  `packages/create-webiny-project` and run `npm link`

Next:
Navigate to the directory where you want to create your webiny project and run
`create-webiny-project projectName -t templateName --tag ../path/to/node_modules`

Note:
The templateName can either be `full` (This will pull a package named `cwp-template-full` from npm template) or actually link to the path of the template you wish to use locally ex. `../dev/template-to-use`

