# Infrastructure configuration

Webiny ships with two sets of infrastructure configuration out of the box.
There are `dev` and `prod` configurations.

## Configuration overview

`dev` is a configuration you would typically use in your development. It configures a non-VPC set of resources. It's less secure, but a lot cheaper to run.

`prod` is a configuration you want to use in production. It contains a full VPC setup. It's a lot more secure, but comes with at least $40/month cost for NAT Gateway.

## How to use each configuration?

In the [index.ts](./index.ts) file, you'll find that we only deploy the `prod` configuration if you run deploy using the `--env=prod` parameter.

All other environments will be deployed using the `dev` configuration. 

> You're welcome to customize the configuration as much as want. If you have different requirements for your environments, go ahead and modify the conditions and how you import configurations.
