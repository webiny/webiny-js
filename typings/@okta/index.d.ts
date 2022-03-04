/**
 * https://github.com/okta/okta-signin-widget/pull/1443#issuecomment-918008714
 */
declare module '@okta/okta-signin-widget' {
    import { OktaAuth, OktaAuthOptions, Tokens } from '@okta/okta-auth-js'
    
    export interface OktaSignInExternalIdentityProvider {
        id: string
        type?: 'GOOGLE' | 'FACEBOOK' | 'APPLE' | 'MICROSOFT' | 'LINKEDIN'
        text?: string
        className?: string
    }
    
    export interface OktaSignInConfig {
        // Basic
        
        /** The base URL for your Okta organization */
        baseUrl: string
        /** Local path or URL to a logo image that is displayed at the top of the Sign-In Widget */
        logo?: string
        /** Text for alt attribute of the logo image, logo text will only show up when logo image is not avaiable */
        logoText?: string
        /** Support phone number that is displayed in the Password Reset and Unlock Account flows. If no number is provided, no support screen is shown to the user. */
        helpSupportNumber?: string
        /** The brand or company name that is displayed in messages rendered by the Sign-in Widget (for example, "Reset your {brandName} password"). If no brandName is provided, a generic message is rendered instead (for example, "Reset your password"). You can further customize the text that is displayed with language and text settings. */
        brandName?: string
        
        // OpenID Connect (OIDC)
        
        /** Client Id of the application. Required for OIDC flow. If this option is not set, all other options in this section are ignored. */
        clientId?: string
        /** For redirect flows, this URI will be used as the callback url. If no redirectUri is provided, defaults to the current origin. */
        redirectUri?: string
        /** External Identity Providers to use in OIDC authentication, also known as Social Login. Supported IDPs are declared with a `type` and will get distinct styling and default i18n text, while any other entry will receive a general styling and require text to be provided. Each IDP can have additional CSS classes added via an optional `className` property. */
        idps?: OktaSignInExternalIdentityProvider[]
        /** Display order for external identity providers relative to the Okta login form. Defaults to 'SECONDARY'. */
        idpDisplay?: 'PRIMARY' | 'SECONDARY'
        /** Timeout for OIDC authentication flow requests, in milliseconds. If the authentication flow takes longer than this timeout value, an error will be thrown and the flow will be cancelled. Defaults to 12000. */
        oAuthTimeout?: number
        /** An `AuthJS` instance. This will be available on the widget instance as the `authClient` property. Note: If the `authClient` option is used, `authParams` will be ignored. */
        authClient?: OktaAuth
        /** An object containing configuration which is used to create the internal authClient`. Selected options are described below. See the full set of Configuration options */
        authParams?: OktaAuthOptions
    }
    
    export interface OktaSignInShowOptions {
        /** CSS selector which identifies the container element that the widget attaches to. If omitted, defaults to the value passed in during the construction of the Widget.*/
        el?: string
        /** Client Id pre-registered with Okta for the OIDC authentication flow. If omitted, defaults to the value passed in during the construction of the Widget. */
        clientId?: string
        /** The url that is redirected to after authentication. This must be pre-registered as part of client registration. Defaults to the current origin.*/
        redirectUri?: string
    }
    
    export interface OktaSignInShowScopedOptions extends OktaSignInShowOptions {
        /** Specify what information to make available in the returned access or ID token. If omitted, defaults to the value of authParams.scopes passed in during construction of the Widget. Defaults to ['openid', 'email'] */
        scopes?: string[]
    }
    
    export type OktaSignInEvent = 'ready' | 'afterError' | 'afterRender'
    export interface OktaSignInEventCallback {
        (
            context: { controller: string },
            error?: {
                name: string
                message: string
                statusCode?: number
                xhr?: any
            },
        ): any
    }
    
    export default class OktaSignIn {
        constructor(config: OktaSignInConfig)
        /** Renders the widget to the DOM to prompt the user to sign in. On successful authentication, the Promise will be resolved to an object containing OAuth tokens. */
        showSignInToGetTokens(options: OktaSignInShowScopedOptions): Promise<Tokens>
        /** Renders the widget to the DOM to prompt the user to sign in. On successful authentication, the browser will be redirected to Okta with information to begin a new session. Okta's servers will process the information and then redirect back to your application's redirectUri. If successful, an authorization code will exist in the URL as the "code" query parameter. If unsuccessful, there will be an "error" query parameter in the URL. */
        showSignInAndRedirect(options: OktaSignInShowOptions): Promise<void>
        /** Renders the widget to the DOM. On success, the promise will resolve. On error, the promise will reject. Also accepts a success or error callback function. */
        renderEl(
            options: { el?: string },
            success?: (opts: any) => any,
            error?: (err: Error) => any,
        ): Promise<any>
        /** Hide the widget, but keep the widget in the DOM. */
        hide(): void
        /** Show the widget if hidden. */
        show(): void
        /** Remove the widget from the DOM entirely. */
        remove(): void
        /** Subscribe to an event published by the widget. */
        on(event: OktaSignInEvent, callback: OktaSignInEventCallback): void
        /** Unsubscribe from widget events. If no callback is provided, unsubscribes all listeners from the event. */
        off(event?: OktaSignInEvent, callback?: OktaSignInEventCallback): void
        /** The underlying @okta/okta-auth-js object used by the Sign-in Widget. All methods are documented in the AuthJS base library. */
        authClient: OktaAuth
    }
}