// Test importing the SDK using the package name (via pnpm workspace)
// Make sure you have run `pnpm install` in the root after adding the SDK
// Also ensure the SDK has been built (`pnpm --filter sdk build`)
import { setKey, patch } from 'errly'; // Use package name defined in root package.json

async function runTest() {
  console.log('Import successful via package name!');

  // --- IMPORTANT: Replace with the actual API Key from your Supabase 'projects' table ---
  const apiKey = '0dac856c-096a-4243-bfe6-d76e09aa3dc0';

  if (apiKey === 'PASTE_YOUR_API_KEY_HERE') {
    console.error('Please replace PASTE_YOUR_API_KEY_HERE in test-sdk.js with your actual API key.');
    return;
  }

  setKey(apiKey);
  patch(); // Patch console.error to use console.ext

  console.log('SDK Initialized and console patched.');

  // Trigger an error using the patched console
  // The original console.error will be called first, then our SDK sends it.
  console.error('This is a test error sent via console.error -> console.ext');

  // Example with an actual Error object:
  // console.error(new Error('This is an actual Error object test.'));

  // You can also call console.ext directly if needed, though patching .error is the primary use case
  // console.ext('Direct call to console.ext', new Error('Another test error'));

  console.log("Test error sent. Check your API server logs and Supabase 'errors' table.");
}

runTest().catch(err => {
  console.error('Error running test script:', err);
}); 