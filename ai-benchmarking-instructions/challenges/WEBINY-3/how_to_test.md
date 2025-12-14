File: /packages/api-mailer/src/crud/settings/password.ts

   Issues with this file:

     - Code duplication: The encrypt and decrypt functions have nearly identical error handling and validation logic
     - Inconsistent error messages: The error message in encrypt (line 34) says "Cannot call decrypt" but should say "encrypt"
     - Silent error handling: Using console.log for errors instead of proper error logging or throwing errors
     - Empty catch blocks: Catching errors but not doing anything meaningful with them
     - Unclear return behavior: Functions return empty string on errors without making this clear to callers
     - Missing error information: When catching exceptions, the actual error is discarded (lines 25-27 and 41-43)
     - Inconsistent null handling: The functions handle null and undefined values but don't document this behavior