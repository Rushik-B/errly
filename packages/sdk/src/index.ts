/// <reference types="node" />

    // packages/sdk/src/index.ts
    // Removed undici import as fetch is often globally available
    // import { fetch } from 'undici';

    let key: string = '';
    const defaultApiEndpoint = 'https://errly-api.vercel.app/api/errors'; // Default for local dev
    // This holds the API key, scoped to this module.
    // In a real-world scenario, you might want a more robust way
    // to manage this state, but for an MVP, this is fine.

    /**
     * Sets the API key necessary to authenticate with the Errly API.
     * @param k - The API key provided by Errly.
     */
    export function setKey(k: string): void {
      if (!k || typeof k !== 'string') {
          // Use console.warn for SDK issues to avoid potential loops if console.error is also wrapped elsewhere
          console.warn('Errly SDK Warning: Invalid API key provided to setKey.');
          return;
      }
      key = k;
      // In a real SDK, you might add more validation or store this more securely.
      console.log('Errly SDK: API key set.');
    }

    /**
     * Adds the .text method to the global console object.
     * Calling console.text(...) will log using console.error and send the event to Errly.
     */
    export function patch(): void {
      // Ensure console exists before trying to patch it
      if (typeof console === 'undefined') {
          // Cannot warn if console doesn't exist.
          return; // Silently return if console is not available
      }

      // Prevent double-patching console.text
      if ((console as any).text) {
          console.warn('Errly SDK Warning: console.text seems to be already defined.');
          return;
      }

      // Store original console.error to retain its logging behavior
      const origError = console.error;

      // Define the new console.text method
      (console as any).text = (...args: any[]): void => {
        // 1. Call the original console.error to ensure the message appears in the console
        origError.apply(console, args);

        // 2. Send the event to the Errly API
        if (!key) {
          // Use console.warn for SDK internal issues
          console.warn('Errly SDK Warning: API key not set. Call setKey() before using console.text().');
          return; // Don't proceed if the key isn't set.
        }

        // Use a separate function to avoid blocking the main thread
        sendEvent('error', args).catch(err => {
            // Use console.warn for SDK internal failures
            console.warn(`Errly SDK Warning: Failed to send event via console.text() - ${err.message}`);
        });
      };

      // No longer overwriting console.error

      console.log('Errly SDK: console.text() method added.');
    }

    /**
     * Sends the captured event data to the Errly API endpoint.
     * @param level - The log level (e.g., 'error'). Currently hardcoded.
     * @param args - The arguments passed to the console method.
     */
    async function sendEvent(level: string, args: any[]): Promise<void> {
      // Use the hardcoded default endpoint directly
      const apiUrl = defaultApiEndpoint;

      // 1. Format the arguments into a single message string
      const message = args
        .map(arg => {
          if (arg instanceof Error) {
            // Include stack trace directly in the message for simpler display in some cases
            return arg.stack || arg.toString();
          }
          try {
            // Attempt to stringify objects, handle primitives
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          } catch (e) {
            return '[Unserializable Object]';
          }
        })
        .join(' '); // Join arguments with a space

      // 2. Extract stack trace if an Error object is present (can be redundant if included above)
      const errorArg = args.find(arg => arg instanceof Error);
      const stackTrace = errorArg ? errorArg.stack : undefined;

      // 3. Prepare metadata - Use original args, filter out Error if needed later
      const metadata = args.length > 0 ? { originalArgs: args } : undefined; // Send args if any provided

      console.log(`Errly SDK: Attempting to send event via console.text() to: ${apiUrl}`);

      const payload = {
        apiKey: key,
        message: message,
        stackTrace: stackTrace,
        metadata: metadata,
        level: level
      };

      // Use fetch with keepalive: true for reliability during page unloads
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true // <<< Add the keepalive flag
        });

        // Note: We generally won't get to process the response when keepalive is used
        // during page unload, but we check it just in case the fetch completes
        // before unload or if keepalive isn't strictly needed for the specific call.
        if (!response.ok) {
          const responseBody = await response.text(); // Attempt to read response if possible
          console.warn(
            `Errly SDK Warning: fetch request for console.text() failed with status ${response.status}. Endpoint: ${apiUrl}. Response: ${responseBody}`
          );
        }
      } catch (error: any) {
        // Log fetch-specific network errors
        console.warn(`Errry SDK Warning: fetch network error sending console.text() event - ${error.message}`);
      }
    }

    // Type augmentation for the global Console interface
    declare global {
      interface Console {
        /**
         * Logs an error message using the original console.error behavior
         * AND sends the log data to the Errly API.
         * Requires `setKey` and `patch` (or setup) to be called first.
         * @param args - Arguments to log, similar to console.error.
         */
        text: (...args: any[]) => void;
      }
    }

    // Optional: Log when the SDK module is loaded
    console.log('Errly SDK loaded (provides console.text).');