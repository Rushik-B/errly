# Errly SDK (`errly`)

Send `console.text` logs to Errly.

## Installation

```bash
npm install errly # or pnpm add errly / yarn add errly
```

## Basic Usage

```typescript
import { setKey, patch } from 'errly';

// 1. Set your Errly Project API Key
setKey('YOUR_ERRLY_PROJECT_API_KEY');

// 2. Patch the console object to add console.text
patch();

// 3. Use console.text wherever you want to log an event to Errly
function someOperation() {
  try {
    // ... do something that might fail ...
    throw new Error('Something went wrong!');
  } catch (error) {
    // Log the error details to Errly (and also to the regular console via console.error)
    console.text('Operation failed', { additionalData: 'context' }, error);
  }
}

someOperation();
```

## Configuration

### API Endpoint

By default, the SDK sends events to `http://127.0.0.1:3001/api/errors`. You can override this by setting the `ERRLY_API_ENDPOINT` environment variable.

## API

*   `setKey(apiKey: string): void`
    *   Sets the API key required to authenticate with the Errly API.
*   `patch(): void`
    *   Adds the `text` method to the global `console` object. The `text` method calls the original `console.error` and sends the log data to the configured Errly API endpoint.

## License

[ISC](LICENSE) 