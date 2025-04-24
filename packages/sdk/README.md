# Errly SDK (`errly-sdk`)

[![npm version](https://badge.fury.io/js/errly-sdk.svg)](https://badge.fury.io/js/errly-sdk)

**Stop losing revenue to silent errors. Get instant alerts for critical issues before they impact your users.**

The official JavaScript SDK for [Errly](https://errly.vercel.app/) (Your deployed frontend/marketing site URL - **Please update this link!**). Errly provides simple, instant error alerting via SMS and voice calls, focused on preventing downtime for developers, startups, and small teams.

This SDK captures logs sent via a special `console.text()` method and forwards them to the Errly API for alerting and analysis.

## Problem Solved

Standard logging and error tracking often involves complex setup (like DataDog) or relies on you manually checking dashboards. Critical errors can go unnoticed for hours, leading to lost revenue and customer trust.

Errly focuses on **immediate notification** for the errors *you* deem critical, using `console.text()` as the trigger.

## Installation

```bash
npm install errly-sdk
# or
pnpm add errly-sdk
# or
yarn add errly-sdk
```

## Quick Start

Integrate Errly into your JavaScript/TypeScript application in seconds:

```typescript
import { setKey, patch } from 'errly-sdk';

// --- Initialization (Run this once, early in your app's lifecycle) ---

// 1. Set your unique Errly Project API Key (Get this from your Errly dashboard)
setKey('YOUR_ERRLY_PROJECT_API_KEY');

// 2. Patch the global console object to add the `console.text` method
//    This needs to run before your first call to console.text()
patch();

// --- Usage (Call console.text where you need critical alerts) ---

function processPayment(amount: number) {
  try {
    // ... payment processing logic ...
    if (amount > 10000) {
      throw new Error('Payment amount exceeds limit');
    }
    console.log('Payment successful!'); // Regular logs are unaffected
  } catch (error) {
    // THIS is where you use Errly:
    // Log the critical error details to Errly for instant alerting.
    // This will ALSO call the original console.error, so you still see it in your standard logs.
    console.text('Critical Payment Failure!', { userId: 'user-123', amount }, error);
  }
}

processPayment(50000);

// You can log various types
console.text('User signup failed', { email: 'test@example.com' });
console.text('Database connection lost');
```

## How it Works

1.  `setKey('YOUR_API_KEY')`: Authenticates your SDK instance with your Errly project.
2.  `patch()`: Adds a new method `text` to the global `console` object.
3.  `console.text(...args)`:
    *   Calls the original `console.error(...args)` so the message still appears in your browser/server console as usual.
    *   Sends the log arguments (message, metadata objects, error stack traces) to the Errly API endpoint (`https://errly.vercel.app/api/errors`) using your API key.
    *   Errly processes the event, handles deduplication/rate-limiting, and triggers notifications (SMS/call) based on your project settings.

## API Reference

*   `setKey(apiKey: string): void`
    *   Sets the API key required to authenticate with the Errly API. Get your key from the Errly dashboard.
*   `patch(): void`
    *   Augments the global `console` object with the `text` method. Should be called once during application startup.
*   `console.text(...args: any[]): void` (Available after `patch()` is called)
    *   Logs arguments to the original `console.error` and sends the event data to Errly for alerting.

## License

[ISC](LICENSE) 