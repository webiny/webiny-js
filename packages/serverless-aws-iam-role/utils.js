const isEqual = require("lodash.isequal");

const addRolePolicy = async ({ iam, name, policy }) => {
    if (policy.hasOwnProperty("arn")) {
        await iam
            .attachRolePolicy({
                RoleName: name,
                PolicyArn: policy.arn
            })
            .promise();
    } else if (Object.keys(policy).length > 0) {
        await iam
            .putRolePolicy({
                RoleName: name,
                PolicyName: `${name}-policy`,
                PolicyDocument: JSON.stringify(policy)
            })
            .promise();
    }
};

const removeRolePolicy = async ({ iam, name, policy }) => {
    if (policy.hasOwnProperty("arn")) {
        return await iam
            .detachRolePolicy({
                RoleName: name,
                PolicyArn: policy.arn
            })
            .promise();
    }

    await iam
        .deleteRolePolicy({
            RoleName: name,
            PolicyName: `${name}-policy`
        })
        .promise();
};

const createRole = async ({ iam, name, service, policy }) => {
    const assumeRolePolicyDocument = {
        Version: "2012-10-17",
        Statement: {
            Effect: "Allow",
            Principal: {
                Service: service
            },
            Action: "sts:AssumeRole"
        }
    };
    const roleRes = await iam
        .createRole({
            RoleName: name,
            Path: "/",
            AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
        })
        .promise();

    await addRolePolicy({
        iam,
        name,
        policy
    });

    return roleRes.Role.Arn;
};

const deleteRole = async ({ iam, name, policy }) => {
    try {
        await removeRolePolicy({
            iam,
            name,
            policy
        });
        await iam
            .deleteRole({
                RoleName: name
            })
            .promise();
    } catch (error) {
        if (
            error.message !== `Policy ${policy.arn} was not found.` &&
            error.code !== "NoSuchEntity"
        ) {
            throw error;
        }
    }
};

const updateAssumeRolePolicy = async ({ iam, name, service }) => {
    const assumeRolePolicyDocument = {
        Version: "2012-10-17",
        Statement: {
            Effect: "Allow",
            Principal: {
                Service: service
            },
            Action: "sts:AssumeRole"
        }
    };
    await iam
        .updateAssumeRolePolicy({
            RoleName: name,
            PolicyDocument: JSON.stringify(assumeRolePolicyDocument)
        })
        .promise();
};

module.exports = {
    createRole,
    deleteRole,
    addRolePolicy,
    removeRolePolicy,
    updateAssumeRolePolicy
};
