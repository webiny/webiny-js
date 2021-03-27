# Description

This Pulumi project deploys a single ES cluster, which is utilized when executing end-to-end Cypress tests in our CI/CD pipeline, which is where it's also deployed.

State files are stored in an S3 bucket, located withing our CI AWS account.
