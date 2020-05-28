const { Component } = require("@webiny/serverless-component");
const IAM = require("aws-sdk/clients/iam");
const isEqual = require("lodash.isequal");

const {
    createRole,
    deleteRole,
    addRolePolicy,
    removeRolePolicy,
    updateAssumeRolePolicy
} = require("./utils");

class ServerlessAwsIamRole extends Component {
    async default(inputs = {}) {
        const iam = new IAM({
            region: inputs.region
        });

        const state = this.state.output || {};

        const name = state.name || this.context.instance.getResourceName();

        const output = {
            name,
            service: inputs.service,
            policy: inputs.policy,
            region: inputs.region
        };

        // If policy is defined inline, remove ARN
        if (inputs.policy.Version && inputs.policy.Statement) {
            delete inputs.policy.arn;
        }

        if (!state.arn) {
            this.context.instance.debug(`Creating role %o.`, name);
            output.arn = await createRole({ iam, name, ...inputs });
        } else {
            if (!isEqual(this.state.inputs, inputs)) {
                if (state.service !== inputs.service) {
                    this.context.instance.debug(`Updating service for role %o.`, name);
                    await updateAssumeRolePolicy({ iam, ...inputs });
                }
                if (!isEqual(state.policy, inputs.policy)) {
                    this.context.instance.debug(`Updating policy for role %o.`, name);
                    await removeRolePolicy({ iam, ...inputs });
                    await addRolePolicy({ iam, ...inputs });
                }
            }
        }

        this.state.inputs = inputs;
        this.state.output = output;

        await this.save();

        this.context.instance.debug(
            `Role %o was successfully deployed to region %o.`,
            name,
            inputs.region
        );

        return this.state.output;
    }

    async remove() {
        this.context.instance.status(`Removing`);

        if (!this.state.output.name) {
            return;
        }

        const iam = new IAM({
            region: this.state.inputs.region
        });

        this.context.instance.debug(
            `Removing role $o from region %o.`,
            this.state.output.name,
            this.state.output.region
        );

        await deleteRole({ iam, ...this.state.output });

        this.context.instance.debug(
            `Role %o successfully removed from region 50.`,
            this.state.output.name,
            this.state.output.region
        );

        this.state = {};
        await this.save();
    }
}

module.exports = ServerlessAwsIamRole;
