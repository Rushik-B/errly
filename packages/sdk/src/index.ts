/// <reference types="node" />

    // packages/sdk/src/index.ts
    // Removed undici import as fetch is often globally available
    // import { fetch } from 'undici';

    let key: string = '';
    const defaultApiEndpoint = 'http://localhost:3000/api/errors'; // Default for local dev
    // This holds the API key, scoped to this module.
    // In a real-world scenario, you might want a more robust way
    // to manage this state, but for an MVP, this is fine.

    /**
     * Sets the API key necessary to authenticate with the Errly API.
     * @param k - The API key provided by Errly.
     */
    export function setKey(k: string): void {
      if (!k || typeof k !== 'string') {
          console.error('Errly SDK Error: Invalid API key provided to setKey.');
          return;
      }
      key = k;
      // In a real SDK, you might add more validation or store this more securely.
      console.log('Errly SDK: API key set.');
    }

    /**
     * Patches the global console object to add the .ext method.
     * Currently patches only console.error.
     */
    export function patch(): void {
      // Ensure console exists before trying to patch it
      if (typeof console === 'undefined') {
          // If console doesn't exist, we cannot patch it and cannot warn about it using console.warn.
          // Return silently or throw a specific SDK error if needed.
          return; // Silently return if console is not available
      }

      // Prevent double-patching
      // Ensure console.ext check is valid now that console is confirmed to exist
      if ((console as any).ext) {
          console.warn('Errly SDK Warning: console.ext seems to be already patched.');
          return;
      }

      const origError = console.error;

      (console as any).ext = (...args: any[]): void => {
        // 1. Call the original console.error so native behavior is preserved
        origError.apply(console, args);

        // 2. Send the event to the Errly API
        if (!key) {
          console.error('Errly SDK Error: API key not set. Please call setKey() first.');
          // Don't proceed if the key isn't set.
          return;
        }

        // Use a separate function to avoid blocking the main thread
        sendEvent('error', args).catch(err => {
            // Log SDK-specific errors without using console.error to avoid loops
            console.warn(`Errly SDK Warning: Failed to send event - ${err.message}`);
        });
      };

      // *** Add this line to actually overwrite console.error ***
      console.error = (console as any).ext;

      console.log('Errly SDK: console.error patched with .ext()');
    }

    /**
     * Sends the captured event data to the Errly API endpoint.
     * @param level - The log level (e.g., 'error').
     * @param args - The arguments passed to the console method.
     */
    async function sendEvent(level: string, args: any[]): Promise<void> {
      // Allow overriding the endpoint via environment variable
      // Make sure process is checked for existence if running in non-Node envs
      const apiUrl = (typeof process !== 'undefined' && process.env.ERRLY_API_ENDPOINT) 
                     ? process.env.ERRLY_API_ENDPOINT 
                     : defaultApiEndpoint;

      // 1. Format the arguments into a single message string
      //    This is a simple approach; more sophisticated formatting might be needed.
      const message = args
        .map(arg => {
          if (arg instanceof Error) {
            return arg.toString(); // Includes name and message
          }
          try {
            // Attempt to stringify objects, handle primitives
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          } catch (e) {
            return '[Unserializable Object]';
          }
        })
        .join(' '); // Join arguments with a space

      // 2. Extract stack trace if an Error object is present
      const errorArg = args.find(arg => arg instanceof Error);
      const stackTrace = errorArg ? errorArg.stack : undefined;

      // 3. (Optional) Prepare metadata - sending the raw args array for now
      //    Or could filter out the Error object, etc.
      const metadata = args.length > 1 ? { originalArgs: args } : undefined;

      console.log(`Errly SDK: Attempting to send event to: ${apiUrl}`);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // API key is now sent in the body, remove 'x-key' header
          },
          body: JSON.stringify({
            apiKey: key, // Send API key in the body
            message: message, // Send the formatted message
            stackTrace: stackTrace, // Send stack if available
            metadata: metadata, // Send extra data if available
          }),
        });

        if (!response.ok) {
          // Log non-2xx responses without using console.error
          const responseBody = await response.text(); // Try to get more info
          console.warn(
            `Errly SDK Warning: API request to ${apiUrl} failed with status ${response.status}. Response: ${responseBody}`
          );
        }
        // If response.ok, do nothing - fire and forget unless debugging needed
      } catch (error: any) {
        // Network errors or other fetch issues
        console.warn(`Errly SDK Warning: Network error sending event - ${error.message}`);
        throw error; // Re-throw so the caller's catch can see it if needed
      }
    }

    // Type augmentation for the global Console interface
    declare global {
      interface Console {
        /**
         * Logs an error message and sends it to the Errly API.
         * Requires `setKey` and `patch` to be called first.
         */
        ext: (...args: any[]) => void;
      }
    }

    // Optional: Log when the SDK module is loaded
    console.log('Errly SDK loaded.');