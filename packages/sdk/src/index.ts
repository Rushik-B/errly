/// <reference types="node" />

    // packages/sdk/src/index.ts
    // Removed undici import as fetch is often globally available
    // import { fetch } from 'undici';

    let key: string = '';
    const defaultApiEndpoint = 'https://errly-api.vercel.app/api/errors'; // Default for local dev
    // This holds the API key, scoped to this module.
    // In a real-world scenario, you might want a more robust way
    // to manage this state, but for an MVP, this is fine.

    // Store original console methods
    let origError: (...args: any[]) => void = () => {}; // Initialize with dummy functions
    let origWarn: (...args: any[]) => void = () => {};
    let origInfo: (...args: any[]) => void = () => {};
    let origLog: (...args: any[]) => void = () => {};

    // Keep track if console exists and methods are patched
    let consoleExists = typeof console !== 'undefined';
    let patched = false;

    /**
     * Sets the API key necessary to authenticate with the Errly API.
     * @param k - The API key provided by Errly.
     */
    export function setKey(k: string): void {
      if (!k || typeof k !== 'string') {
          // Use console.warn for SDK issues to avoid potential loops if console itself is problematic
          if (consoleExists) {
              origWarn('Errly SDK Warning: Invalid API key provided to setKey.');
          }
          return;
      }
      key = k;
      if (consoleExists) {
        origLog('Errly SDK: API key set.'); // Use original log
      }
    }

    /**
     * Adds the .text method to the global console object.
     * Calling console.text([level], ...args) will log using the corresponding
     * original console method (or console.error by default) and send the event to Errly.
     */
    export function patch(): void {
      if (!consoleExists) {
          // Cannot warn if console doesn't exist.
          return; // Silently return if console is not available
      }

      if (patched) {
          origWarn('Errly SDK Warning: Console already patched via patch().'); // Use original warn
          return;
      }

      // Store originals *before* patching
      // Check if methods actually exist on console before assigning
      origError = typeof console.error === 'function' ? console.error : console.log; // Fallback to log
      origWarn = typeof console.warn === 'function' ? console.warn : console.log;
      origInfo = typeof console.info === 'function' ? console.info : console.log;
      origLog = typeof console.log === 'function' ? console.log : () => {}; // Fallback to no-op

      // Define the valid levels Errly recognizes
      const validErrlyLevels = ['error', 'warn', 'info', 'log'];
      const defaultLevel = 'error'; // Default level if none specified
      let defaultOrigMethod = origError; // Default console method to call (will be error)

      // Prevent double-patching console.text (if somehow defined elsewhere)
      if ((console as any).text) {
          origWarn('Errly SDK Warning: console.text seems to be already defined before patch().');
          // Decide whether to overwrite or return - let's overwrite but warn.
      }

      // Define the new console.text method
      (console as any).text = (...args: any[]): void => {
        let level = defaultLevel;
        let messageArgs = args;
        let origConsoleMethod = defaultOrigMethod;

        // Check if the first argument is a valid level string
        if (args.length > 0 && typeof args[0] === 'string' && validErrlyLevels.includes(args[0].toLowerCase())) {
          level = args[0].toLowerCase(); // Use lowercase level
          messageArgs = args.slice(1); // Use remaining args for the message
          // Select the corresponding original console method
          switch (level) {
            case 'error': origConsoleMethod = origError; break;
            case 'warn': origConsoleMethod = origWarn; break;
            case 'info': origConsoleMethod = origInfo; break;
            case 'log': origConsoleMethod = origLog; break;
            // No default needed here as defaultLevel is set above
          }
        } else {
          // First arg is not a level, use default level and method
          level = defaultLevel;
          messageArgs = args;
          origConsoleMethod = defaultOrigMethod;
        }

        // 1. Call the determined original console method
        // Use try-catch in case the original method is somehow unavailable or throws
        try {
            // Ensure the method exists before calling
            if (typeof origConsoleMethod === 'function') {
                origConsoleMethod.apply(console, messageArgs);
            } else {
                // Fallback if somehow the stored original method isn't callable
                origLog.apply(console, ['[Errly SDK Fallback Log]', ...messageArgs]);
            }
        } catch (e: any) {
            // Fallback to basic console.log if the intended original method failed during execution
            origLog.apply(console, ['[Errly SDK Fallback Log]', ...messageArgs, `(Original method call for level '${level}' failed: ${e.message})`]);
        }


        // 2. Send the event to the Errly API
        if (!key) {
          // Use original warn to avoid loops if console.warn is part of console.text
          origWarn('Errly SDK Warning: API key not set. Call setKey() before using console.text().');
          return; // Don't proceed if the key isn't set.
        }

        // Use a separate async function to avoid blocking
        sendEvent(level, messageArgs).catch(err => {
            // Use original warn for SDK internal failures
            origWarn(`Errly SDK Warning: Failed to send event via console.text() - ${err.message}`);
        });
      };

      // Remove the logic that overwrites console.error - we only add .text now

      patched = true;
      origLog(`Errly SDK: console.text() method added/patched. Default level: ${defaultLevel}.`); // Use original log
    }

    /**
     * Sends the captured event data to the Errly API endpoint.
     * @param level - The log level (e.g., 'error', 'warn', 'info', 'log').
     * @param args - The arguments passed to the console method (excluding the level if provided).
     */
    async function sendEvent(level: string, args: any[]): Promise<void> {
      // Use the hardcoded default endpoint directly
      const apiUrl = defaultApiEndpoint;

      // 1. Format the arguments into a single message string
      let message = '';
      try {
        message = args
          .map(arg => {
            if (arg instanceof Error) {
              // Use the error's message, fallback to toString(), avoid the full stack here.
              return arg.message || arg.toString();
            }
            // Check for null/undefined explicitly
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';

            // Attempt to stringify objects, handle primitives, catch cyclic errors
            if (typeof arg === 'object') {
               try {
                   return JSON.stringify(arg);
               } catch (stringifyError: any) {
                   // Handle potential cyclic references or other stringify errors
                   if (stringifyError instanceof Error && stringifyError.message.includes('circular structure')) {
                        return '[Circular Object]';
                   }
                   return '[Unserializable Object]';
               }
            }
            // Handle other primitives (string, number, boolean, bigint, symbol)
            return String(arg);
          })
          .join(' '); // Join arguments with a space
      } catch (formatError: any) {
          message = "[Errly SDK Formatting Error]";
          origWarn(`Errly SDK Warning: Error formatting log arguments: ${formatError.message}`);
      }


      // 2. Extract stack trace if an Error object is present
      const errorArg = args.find(arg => arg instanceof Error);
      // Ensure stack trace is a string, even if it's empty
      const stackTrace = (errorArg instanceof Error && typeof errorArg.stack === 'string') ? errorArg.stack : undefined;


      // 3. Prepare metadata - Filter out Error objects from original args
      let metadata: object | undefined = undefined;
      try {
          const filteredArgs = args.filter(arg => !(arg instanceof Error));
          // Only include metadata if there are non-Error args remaining
          if (filteredArgs.length > 0) {
              // Attempt to structure metadata, handle potential stringification issues
              try {
                  // Ensure metadata can be stringified for the API request
                  const stringifiableArgs = filteredArgs.map(arg => {
                      try {
                          // Test stringify each arg; replace unstringifiable ones
                          JSON.stringify(arg);
                          return arg;
                      } catch {
                          return '[Unserializable Argument]'
                      }
                  });
                  metadata = { originalArgs: stringifiableArgs };
              } catch (metaError) {
                  metadata = { error: "Failed to serialize metadata" };
              }
          }
      } catch (metaError: any) {
          origWarn(`Errly SDK Warning: Error preparing metadata: ${metaError.message}`);
          metadata = { error: "Failed to prepare metadata" };
      }


      origLog(`Errly SDK: Attempting to send ${level} event via console.text() to: ${apiUrl}`); // Use original log

      const payload = {
        apiKey: key,
        message: message,
        stackTrace: stackTrace,
        metadata: metadata, // Can be undefined or an object
        level: level
      };

      // Use fetch with keepalive: true for reliability during page unloads
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload), // Stringify the final payload
          keepalive: true // <<< Keep the keepalive flag
        });

        // Note: We generally won't get to process the response when keepalive is used
        // during page unload, but we check it just in case the fetch completes
        // before unload or if keepalive isn't strictly needed for the specific call.
        if (!response.ok) {
          let responseBody = '[Could not read response body]';
          try {
               responseBody = await response.text(); // Attempt to read response if possible
               // Truncate long responses
               if (responseBody.length > 500) {
                   responseBody = responseBody.substring(0, 500) + '...';
               }
          } catch { /* Ignore read error */ }
          origWarn( // Use original warn
            `Errly SDK Warning: fetch request for console.text() (${level}) failed with status ${response.status}. Endpoint: ${apiUrl}. Response: ${responseBody}`
          );
        }
      } catch (error: any) {
        // Log fetch-specific network errors
        origWarn(`Errly SDK Warning: fetch network error sending ${level} event via console.text() - ${error.message}`); // Use original warn
      }
    }

    // Type augmentation for the global Console interface
    declare global {
      interface Console {
        /**
         * Logs a message using the corresponding original console method (or console.error by default)
         * AND sends the log data to the Errly API.
         * Requires `setKey` and `patch` to be called first.
         *
         * @param levelOrArg Optional log level ('error', 'warn', 'info', 'log'). Case-insensitive. If omitted or not a valid level, defaults to 'error'.
         * @param args Arguments to log, similar to console.log/error etc.
         */
        text: (...args: any[]) => void;
      }
    }

    // Optional: Log when the SDK module is loaded
    if (consoleExists) {
        origLog('Errly SDK loaded (provides console.text).'); // Use original log
    }