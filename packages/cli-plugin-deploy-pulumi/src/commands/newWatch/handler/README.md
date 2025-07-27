## About

This folder contains the AWS Lambda function code that gets uploaded by the `webiny watch` command.

The code basically enables forwarding of events from AWS Lambda to the `webiny watch` command, which then runs the actual function code in the local environment.

Learn more: https://webiny.link/local-aws-lambda-development.

## Development

In this folder, you can find the `handler.zip` file, which is what the `webiny watch` command uploads to AWS Lambda.

In the archive, you will find the following files:
1. `handler.js` - the main handler code that processes incoming events and forwards them to the local environment
2. `mqtt.js` - a utility for handling MQTT messages (already prepared for direct import in `handler.js`, no NPM install needed).

In case you need to update the handler code, you must manually unzip the file, make the changes, and then zip it again.

To test the changes, build the `@webiny/cli-plugin-deploy-pulumi` package and run the `webiny watch` command. The command will automatically upload the new `handler.zip` file to AWS Lambda.

Repeat the process until you are satisfied with the results.

Note that, to build the `@webiny/cli-plugin-deploy-pulumi` package, run the following command from the root of the Webiny project:

```bash
yarn build -p @webiny/cli-plugin-deploy-pulumi
```
### Development via AWS Lambda Console

Another way to iterate on the code a bit faster is to simply use the AWS Lambda console directly. 

Just run the `webiny watch` command, and then open the AWS Lambda console and find the function you wish to test your changes with. You can then edit the `handler.js` file directly in the console. Once you're done with, just c/p the code from the console and paste it into the `handler.js` file in this folder, and then zip it again.

