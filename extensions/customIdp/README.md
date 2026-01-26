# Custom IDP Integration

This extension provides a complete authentication flow for integrating Webiny Admin and API with a custom Identity Provider (IDP). It handles token management, automatic token refresh, and authentication error handling using Webiny's clean architecture patterns.

## Overview

The CustomIdp extension bridges your external IDP with Webiny's authentication system. It manages JWT tokens (idToken and refreshToken), automatically refreshes expired tokens, and handles authentication errors from API calls.

## Architecture

The extension follows Webiny's feature-based clean architecture with proper separation of concerns:

### Layers

**Presentation Layer:**
- `CustomIdpView.tsx` - Decorates the LoginScreenComponent to manage authentication UI state
- `Extension.tsx` - Registers the feature with configuration

**Application Layer:**
- `CustomIdpPresenter.ts` - Orchestrates the authentication flow, manages token lifecycle, and integrates with Webiny's LogInUseCase

**Domain Layer:**
- `CustomIdpRepository.ts` - Manages IDP authentication state and token storage
- `abstractions.ts` - Defines all interfaces and DI tokens

**Infrastructure Layer:**
- `JwtValidationGateway.ts` - JWT decoding and expiry validation using jwt-decode
- `TokenRefreshGateway.ts` - HTTP calls to refresh tokens via your IDP's refresh endpoint
- `IdpRedirectGateway.ts` - Handles redirects to your IDP login page
- `AuthenticationErrorHandler.ts` - Global error handler for authentication failures

## Key Features

### 1. **Token Management**
- Stores idToken and refreshToken in localStorage with automatic namespacing
- Tokens are validated on initialization and refreshed if expired
- MobX-powered reactive state management

### 2. **Automatic Token Refresh**
- Configurable refresh interval (default: 60 seconds)
- Validates JWT expiry with 10-second buffer
- Graceful error handling with automatic redirect on refresh failure

### 3. **Authentication Error Handling**
- Global monitoring of all GraphQL API calls
- Detects errors with `code` starting with "Authentication/"
- Automatically redirects to IDP login page with error context
- Independent of the login/refresh flow (event-driven)

### 4. **Webiny Integration**
- Uses Webiny's `LogInUseCase` for authentication within Webiny
- Provides `idTokenProvider` callback for Webiny's authentication system

## How It Works

### Initialization Flow

1. **Parse Tokens from URL**
   - Extracts `idToken` and `refreshToken` from URL query parameters
   - Cleans URL by removing token parameters

2. **Token Validation**
   - Checks if tokens exist in localStorage
   - If missing → redirects to IDP login page
   - If expired → refreshes tokens via IDP refresh endpoint

3. **Webiny Authentication**
   - Calls `LogInUseCase.execute()` with token provider
   - Webiny fetches user identity from API using provided idToken
   - Sets identity in `IdentityContext`

4. **Start Refresh Loop**
   - Begins periodic token refresh based on configured interval
   - Continues until logout or error

### Authentication Error Handling

The `AuthenticationErrorHandler` listens to authentication error events from **any** API call, and  redirects to IDP login page with error parameter. This is completely independent of the login/refresh flow and provides global error monitoring.

## Configuration

The feature requires three configuration options:

```typescript
{
    loginUrl: string;              // Your IDP login page URL
    refreshUrl: string;            // Your IDP token refresh endpoint
    refreshIntervalSeconds: number; // How often to refresh tokens
}
```
