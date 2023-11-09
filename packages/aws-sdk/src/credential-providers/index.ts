export {
    fromCognitoIdentity,
    fromCognitoIdentityPool,
    fromContainerMetadata,
    fromEnv,
    fromHttp,
    fromIni,
    fromInstanceMetadata,
    fromNodeProviderChain,
    fromProcess,
    fromSSO,
    fromTemporaryCredentials,
    fromTokenFile,
    fromWebToken
} from "@aws-sdk/credential-providers";
export type {
    FromCognitoIdentityParameters,
    FromCognitoIdentityPoolParameters,
    FromHttpOptions,
    FromIniInit,
    FromProcessInit,
    FromSSOInit,
    FromTemporaryCredentialsOptions,
    FromTokenFileInit,
    FromWebTokenInit,
    RemoteProviderInit,
    fromNodeProviderChainInit,
    CognitoIdentityCredentialProvider,
    HttpProviderCredentials
} from "@aws-sdk/credential-providers";
