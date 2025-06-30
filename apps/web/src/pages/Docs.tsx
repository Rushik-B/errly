import React, { useState } from 'react';
// Import the syntax highlighter and a theme
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism/index.js';
import DocsSidebar from '../components/DocsSidebar.tsx';
import NavBar from '../components/NavBar.tsx';

// Simple horizontal rule for separation
const Hr = () => <hr className="my-8 border-gray-700/50" />;

const DocsPage: React.FC = () => {
  /* --------------------------------------------------------------------
   * CONSTANTS
   * ------------------------------------------------------------------*/
  const frameworks = ['React', 'Vanilla JS', 'Node.js'];
  const [activeFramework, setActiveFramework] = useState(frameworks[0]);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const quickStartLanguages = ['JavaScript / TypeScript', 'Python', 'C#', 'Go', 'PHP', 'Ruby', 'Swift'];
  const [activeQuickStartLanguage, setActiveQuickStartLanguage] = useState(quickStartLanguages[0]);
  const usageLanguages = ['JavaScript', 'Python', 'C#', 'Go', 'PHP', 'Ruby', 'Swift'];
  const [activeUsageLanguage, setActiveUsageLanguage] = useState(usageLanguages[0]);

  /* --------------------------------------------------------------------
   * INSTALL COMMANDS
   * ------------------------------------------------------------------*/
  const installNpm = `npm install errly-sdk`;
  const installYarn = `yarn add errly-sdk`;
  const installPnpm = `pnpm add errly-sdk`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – JAVASCRIPT / TYPESCRIPT
   * ------------------------------------------------------------------*/
  const setupCode = `// Import functions from the SDK
import { setKey, patch } from 'errly-sdk';

// --- Initialization (Run once) ---
setKey('YOUR_ERRLY_PROJECT_API_KEY');
patch();
// --- End Initialization ---

console.log('Errly SDK ready!');`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – PYTHON
   * ------------------------------------------------------------------*/
  const pythonQuickStart = `# ---- Errly Quick-Start (copy & paste) ----
import logging, requests, traceback, json

ERRLY_API_KEY = "YOUR_ERRLY_PROJECT_API_KEY"
# Change this URL if your Errly API runs elsewhere (e.g., your production domain)
ERRLY_ENDPOINT = "https://errly-api.vercel.app/api/errors"

class _ErrlyHandler(logging.Handler):
    def emit(self, record):
        try:
            # Prepare the payload according to the API schema
            payload = {
                "apiKey": ERRLY_API_KEY,
                "message": self.format(record),
                "level": record.levelname.lower(),
            }
            if record.exc_info:
                payload["stackTrace"] = "".join(traceback.format_exception(*record.exc_info))

            # Include metadata if present in 'extra'
            metadata = getattr(record, 'extra_errly', {}) # Use a specific key for clarity
            if isinstance(metadata, dict) and metadata:
                payload["metadata"] = metadata

            # Send the request with the API key in the body
            requests.post(
                ERRLY_ENDPOINT,
                headers={"Content-Type": "application/json"}, # No API key header needed
                json=payload,
                timeout=5 # Increased timeout slightly
            )
        except requests.exceptions.RequestException as e:
            # Optionally log errors during sending to Errly itself (e.g., to stderr)
            print(f"Failed to send log to Errly: {e}")
        except Exception as e:
            # Catch other potential errors during formatting/sending
            print(f"Unexpected error in ErrlyHandler: {e}")

# Configure logging - add the Errly handler
# Use a specific dictionary key ('extra_errly') for metadata to avoid conflicts
# with standard logging 'extra' keys if any are used elsewhere.
# Example usage: logging.error("Something failed", extra={'extra_errly': {'user': 123}})
logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler(), _ErrlyHandler()]
)
# ---- End Errly Setup ----`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – C#
   * ------------------------------------------------------------------*/
  const csharpQuickStart = `// ---- Errly Quick-Start C# (.NET) ----
using System;
using System.Net.Http;
using System.Net.Http.Json; // Requires System.Net.Http.Json NuGet package
using System.Text.Json; // Or Newtonsoft.Json
using System.Threading.Tasks;
using System.Collections.Generic; // For Dictionary

public static class ErrlyReporter
{
    private static readonly HttpClient httpClient = new HttpClient();
    private const string ErrlyApiKey = "YOUR_ERRLY_PROJECT_API_KEY";
    private const string ErrlyEndpoint = "https://errly-api.vercel.app/api/errors";

    public static async Task ReportErrorAsync(string level, string message, Dictionary<string, object>? metadata = null, Exception? exception = null)
    {
        if (string.IsNullOrEmpty(ErrlyApiKey)) return;

        var payload = new Dictionary<string, object>
        {
            { "apiKey", ErrlyApiKey },
            { "level", level.ToLowerInvariant() },
            { "message", message }
        };

        if (metadata != null && metadata.Count > 0)
        {
            payload.Add("metadata", metadata);
        }

        if (exception != null)
        {
            payload.Add("stackTrace", exception.ToString()); // Includes message and stack trace
        }

        try
        {
            var content = JsonContent.Create(payload, options: new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            HttpResponseMessage response = await httpClient.PostAsync(ErrlyEndpoint, content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception reporting error to Errly: {ex.Message}");
        }
    }
}

// --- Example Usage (Call this where needed) ---
// await ErrlyReporter.ReportErrorAsync("error", "Something critical broke!", new Dictionary<string, object>{{ "userId", 123 }}, new InvalidOperationException("Oops"));
// Console.WriteLine("Errly C# Reporter Ready!");`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – GO
   * ------------------------------------------------------------------*/
  const goQuickStart = `// ---- Errly Quick-Start Go ----
package main

import (
    "fmt"
    "github.com/errly-io/sdk-go"
)

func main() {
    client := errly.NewClient("YOUR_ERRLY_PROJECT_API_KEY")
    client.Patch()
    fmt.Println("Errly Go SDK ready!")
}`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – PHP
   * ------------------------------------------------------------------*/
  const phpQuickStart = `<?php
  // ---- Errly Quick-Start PHP ----
  
  const ERRLY_API_KEY = 'YOUR_ERRLY_PROJECT_API_KEY';
  const ERRLY_ENDPOINT = 'https://errly-api.vercel.app/api/errors';
  
  function reportErrorToErrly(string $level, string $message, ?array $metadata = null, ?Throwable $exception = null)
  {
      if (empty(ERRLY_API_KEY)) {
          return;
      }
  
      $payload = [
          'apiKey' => ERRLY_API_KEY,
          'level' => strtolower($level),
          'message' => $message,
      ];
  
      if ($metadata !== null && count($metadata) > 0) {
          $payload['metadata'] = $metadata;
      }
  
      if ($exception !== null) {
          $payload['stackTrace'] = $exception->getMessage() . "\\n" . $exception->getTraceAsString();
      }
  
      $jsonData = json_encode($payload);
  
      // Using cURL (ensure it's enabled)
      $ch = curl_init(ERRLY_ENDPOINT);
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
      curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_TIMEOUT, 5);
  
      $response = curl_exec($ch);
      $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
      $curlError = curl_error($ch);
      curl_close($ch);
  
      // Optional: Log cURL errors or non-2xx responses if needed
      // if ($curlError) {
      //     error_log("Errly cURL Error: " . $curlError);
      // } elseif ($httpCode >= 300) {
      //     error_log("Errly HTTP Error: " . $httpCode);
      // }
  }
  
  // --- Example Usage (Call this where needed) ---
  // try {
  //     throw new Exception("Something critical broke!");
  // } catch (Throwable $e) {
  //     reportErrorToErrly('error', $e->getMessage(), ['userId' => 123], $e);
  // }
  // echo "Errly PHP Reporter Ready!\\n"; // Indicate setup
  // ---- End Errly Setup ----
  ?>`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – RUBY
   * ------------------------------------------------------------------*/
  const rubyDirectQuickStart = `# ---- Errly Quick-Start Ruby (Direct HTTP) ----
require 'net/http'
require 'json'
require 'uri'

module ErrlyReporter
  ERRLY_API_KEY = "YOUR_ERRLY_PROJECT_API_KEY"
  ERRLY_ENDPOINT = 'https://errly-api.vercel.app/api/errors'
  ERRLY_TIMEOUT = 5 # seconds

  def self.report(level, message, metadata = {}, exception = nil)
    return if ERRLY_API_KEY.to_s.empty?

    payload = {
      apiKey: ERRLY_API_KEY,
      level: level.to_s.downcase,
      message: message
    }
    payload[:metadata] = metadata if metadata && !metadata.empty?
    if exception
      payload[:stackTrace] = ([exception.message] + exception.backtrace).join("\\n")
    end

    begin
      uri = URI.parse(ERRLY_ENDPOINT)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.open_timeout = ERRLY_TIMEOUT
      http.read_timeout = ERRLY_TIMEOUT

      request = Net::HTTP::Post.new(uri.request_uri,
                                    'Content-Type' => 'application/json')
      request.body = payload.to_json

      response = http.request(request)

      # Optional: Check response
      # unless response.is_a?(Net::HTTPSuccess)
      #   puts "Errly report failed: # {response.code} # {response.message}"
      # end
    rescue StandardError => e
      # Avoid errors in reporting causing further issues
      puts "Exception reporting error to Errly: # {e.message}"
    end
  end
end

# --- Example Usage (Call this where needed) ---
# begin
#   raise StandardError, "Something critical broke!"
# rescue => e
#   ErrlyReporter.report(:error, e.message, { user_id: 123 }, e)
# end
# puts "Errly Ruby Reporter Ready!" # Indicate setup
# ---- End Errly Setup ----`;

  /* --------------------------------------------------------------------
   * QUICK-START SETUP – SWIFT
   * ------------------------------------------------------------------*/
  const swiftQuickStart = `// ---- Errly Quick-Start Swift ----
  import Foundation
  
  // Helper for encoding mixed dictionaries (simplified or use a library)
  struct AnyCodable: Codable {
      let value: Any
  
      init<T>(_ value: T?) {
          self.value = value ?? ()
      }
  
      func encode(to encoder: Encoder) throws {
          var container = encoder.singleValueContainer()
          if let stringValue = value as? String { try container.encode(stringValue) }
          else if let intValue = value as? Int { try container.encode(intValue) }
          else if let doubleValue = value as? Double { try container.encode(doubleValue) }
          else if let boolValue = value as? Bool { try container.encode(boolValue) }
          // Add dictionary/array encoding or use a proper AnyCodable library
          else {
              throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: [], debugDescription: "Unsupported type in AnyCodable for Errly"))
          }
      }
      // Note: Decoding not implemented/needed for sending
  }
  
  
  // Define the payload structure (must match API)
  struct ErrlyPayload: Codable {
      let apiKey: String
      let level: String
      let message: String
      var metadata: [String: AnyCodable]? // Use AnyCodable
      var stackTrace: String?
  
      enum CodingKeys: String, CodingKey {
         case apiKey, level, message, metadata, stackTrace
      }
  }
  
  
  class ErrlyReporter {
      static let shared = ErrlyReporter()
      private let apiKey = "YOUR_ERRLY_PROJECT_API_KEY" // Replace with your key
      private let endpoint = URL(string: "https://errly-api.vercel.app/api/errors")!
      private let session: URLSession
  
      private init() {
          // Configure URLSession (optional, e.g., for custom timeout)
          let configuration = URLSessionConfiguration.default
          configuration.timeoutIntervalForRequest = 5.0 // 5 seconds
          self.session = URLSession(configuration: configuration)
      }
  
      func report(level: String, message: String, metadata: [String: Any]? = nil, error: Error? = nil, callStack: [String]? = Thread.callStackSymbols) {
          guard !apiKey.isEmpty else {
               print("ErrlyReporter: API Key is missing.")
               return
          }
  
          // Prepare metadata
          let codableMetadata = metadata?.mapValues { AnyCodable($0) }
  
          // Prepare stack trace
          var stackTraceString: String? = nil
          if let symbols = callStack {
             stackTraceString = symbols.joined(separator: "\\n")
             // Optionally include error description in stack trace if not already in message
             if let error = error, !message.contains(error.localizedDescription) {
                 stackTraceString = "\(error.localizedDescription)\\n\(stackTraceString ?? "")"
             }
          } else if let error = error {
               stackTraceString = error.localizedDescription // Fallback if symbols aren't available
          }
  
  
          let payload = ErrlyPayload(
              apiKey: apiKey,
              level: level.lowercased(),
              message: message,
              metadata: codableMetadata,
              stackTrace: stackTraceString
          )
  
          var request = URLRequest(url: endpoint)
          request.httpMethod = "POST"
          request.setValue("application/json", forHTTPHeaderField: "Content-Type")
  
          do {
              let encoder = JSONEncoder()
              // encoder.outputFormatting = .prettyPrinted // Optional for debugging
              request.httpBody = try encoder.encode(payload)
          } catch {
              print("ErrlyReporter: Failed to encode payload: \\(error)")
              return
          }
  
          let task = session.dataTask(with: request) { data, response, networkError in
              if let networkError = networkError {
                  print("ErrlyReporter: Network error sending report: \\(networkError.localizedDescription)")
                  return
              }
  
              // Optional: Check HTTP response status code
              // if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
              //     print("ErrlyReporter: Server responded with status \\(httpResponse.statusCode)")
              //     // You might want to log the response body here if available (data)
              // }
          }
          task.resume()
      }
  }
  
  // --- Example Usage (Call this where needed) ---
  // let sampleError = NSError(domain: "com.yourapp.error", code: 101, userInfo: [NSLocalizedDescriptionKey: "Something critical broke in Swift!"])
  // ErrlyReporter.shared.report(level: "error", message: sampleError.localizedDescription, metadata: ["userId": 12345, "attempt": 1], error: sampleError)
  // print("Errly Swift Reporter Ready!") // Indicate setup
  // ---- End Errly Setup ----`;

  /* --------------------------------------------------------------------
   * FRAMEWORK EXAMPLES
   * ------------------------------------------------------------------*/
  const exampleReact = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { setKey, patch } from 'errly-sdk';

setKey('YOUR_ERRLY_PROJECT_API_KEY');
patch();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
  const exampleVanilla = `import { setKey, patch } from 'errly-sdk';
setKey('YOUR_ERRLY_PROJECT_API_KEY');
patch();

// your JS here...`;
  const exampleNode = `import { setKey, patch } from 'errly-sdk';
setKey('YOUR_ERRLY_PROJECT_API_KEY');
patch();

console.log('Errly in Node!');`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – JAVASCRIPT
   * ------------------------------------------------------------------*/
  const usageErrorObject = `function processPayment(amount: number) {
  try {
    // ... payment processing logic ...
    if (amount > 10000) {
      throw new Error('Payment amount exceeds limit');
    }
    console.log('Payment successful!');
  } catch (error) {
    console.text('Critical Payment Failure!', { userId: 'user-123', amount }, error);
  }
}

processPayment(50000);`;
  const usageWarn = `// Specify 'warn' as the level
console.text(
  'warn',
  'Configuration value looks suspicious.',
  {
    config: 'old_value',
    userId: 'admin'
  }
);
// This will call the original console.warn() and send a 'warn' level event to Errly.`;
  const usageInfo = `// Specify 'info' as the level
console.text(
  'info',
  'User logged in successfully.',
  {
    userId: 123
  }
);
// This will call the original console.info() and send an 'info' level event to Errly.`;
  const usageMetadata = `// You can log various types
console.text(
  'User signup failed',
  {
    email: 'test@example.com'
  }
);`;
  const usageSimple = `console.text('Database connection lost');`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – PYTHON
   * ------------------------------------------------------------------*/
  const usagePythonError = `# Assuming logging is configured as per the Quick-Start
import logging

def process_payment(amount):
    try:
        if amount > 10000:
            raise ValueError('Payment amount exceeds limit')
        logging.info('Payment successful!')
    except Exception as e:
        logging.exception(
            "Critical Payment Failure!",
            exc_info=e,
            extra={'extra_errly': {'userId': 'user-123', 'amount': amount}}
        )

process_payment(50000)`;
  const usagePythonWarn = `logging.warning(
    "Configuration value looks suspicious.",
    extra={'extra_errly': {'config': 'old_value', 'userId': 'admin'}}
)`;
  const usagePythonInfo = `logging.info(
    "User logged in successfully.",
    extra={'extra_errly': {'userId': 123}}
)`;
  const usagePythonMetadata = `logging.error(
    "User signup failed",
    extra={'extra_errly': {'email': 'test@example.com'}}
)`;
  const usagePythonSimple = `logging.error("Database connection lost")`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – C#
   * ------------------------------------------------------------------*/
  const usageCSharpError = `try {
    throw new ArgumentNullException(nameof(someVariable));
} catch (Exception ex) {
    var metadata = new Dictionary<string, object> { { "userId", "user-456" }, { "context", "paymentProcessing" } };
    await ErrlyReporter.ReportErrorAsync("error", ex.Message, metadata, ex);
}`;
  const usageCSharpWarn = `await ErrlyReporter.ReportErrorAsync("warn", "API rate limit approaching", new Dictionary<string, object> { { "limit", 1000 }, { "remaining", 50 } });`;
  const usageCSharpInfo = `await ErrlyReporter.ReportErrorAsync("info", "User logged in", new Dictionary<string, object> { { "userId", "user-789" } });`;
  const usageCSharpSimple = `await ErrlyReporter.ReportErrorAsync("error", "Database connection failed");`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – GO
   * ------------------------------------------------------------------*/
  const usageGoError = `func someOperation() error {
    err := errors.New("something went wrong during operation")
    if err != nil {
        metadata := map[string]interface{}{"userId": "user-111", "requestId": "req-abc"}
        ReportError("error", err.Error(), metadata, true)
        return err
    }
    return nil
}`;
  const usageGoWarn = `ReportError("warn", "Cache miss for key X", map[string]interface{}{"cacheKey": "X"}, false)`;
  const usageGoInfo = `ReportError("info", "Service started successfully", nil, false)`;
  const usageGoSimple = `ReportError("error", "Failed to connect to external service", nil, true)`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – PHP
   * ------------------------------------------------------------------*/
  const usagePhpError = `<?php
  // Assuming reportErrorToErrly function is available
  try {
      // ... potentially failing code ...
      if ($invalid_condition) {
          throw new \RuntimeException('Invalid condition encountered');
      }
  } catch (\Throwable $e) {
      $metadata = ['userId' => 'user-php-1', 'orderId' => 12345];
      reportErrorToErrly('error', $e->getMessage(), $metadata, $e);
  }

  // usagePhpWarn
  reportErrorToErrly('warn', 'Deprecated function called', ['function' => 'old_func()']);

  // usagePhpInfo
  reportErrorToErrly('info', 'User registration complete', ['userId' => 'user-php-2']);

  // usagePhpSimple
  reportErrorToErrly('error', 'Could not acquire lock');
  ?>`;
  // Note: The usage examples are combined into one snippet for PHP due to the <?php tag.
  // Separate variables are kept for consistency but only usagePhpError is displayed.
  const usagePhpWarn = usagePhpError; // Placeholder
  const usagePhpInfo = usagePhpError; // Placeholder
  const usagePhpSimple = usagePhpError; // Placeholder

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – RUBY
   * ------------------------------------------------------------------*/
  const usageRubyDirectError = `begin
    # ... potentially failing code ...
    result = 1 / 0 # Raises ZeroDivisionError
  rescue => e
    metadata = { user_id: 'ruby-user-1', context: 'calculation' }
    ErrlyReporter.report(:error, e.message, metadata, e)
  end`;
  const usageRubyDirectWarn = `ErrlyReporter.report(:warn, 'Configuration mismatch detected', { expected: 'v2', actual: 'v1' })`;
  const usageRubyDirectInfo = `ErrlyReporter.report(:info, 'Background job started', { job_id: 'job-555' })`;
  const usageRubyDirectSimple = `ErrlyReporter.report(:error, 'Redis connection timeout')`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – SWIFT
   * ------------------------------------------------------------------*/
  const usageSwiftError = `func performCriticalTask() throws {
    // ... task logic ...
    let someErrorCondition = true // Example condition
    if someErrorCondition {
        let error = NSError(domain: "AppDomain", code: -1001, userInfo: [NSLocalizedDescriptionKey: "Critical task failed due to X"])
        ErrlyReporter.shared.report(
            level: "error",
            message: error.localizedDescription, // Using error's description as the primary message
            metadata: ["userId": "swift-user-1", "taskName": "criticalTask"],
            error: error, // Pass error for potential stack trace generation
            callStack: Thread.callStackSymbols // Explicitly pass symbols
        )
        throw error
    }
  }

  do {
    try performCriticalTask()
  } catch { 
     print("Caught error (already reported to Errly): \\(error)")
  }`;
  const usageSwiftWarn = `ErrlyReporter.shared.report(level: "warn", message: "Low disk space warning", metadata: ["freeSpaceMB": 50, "path": "/var/log"])`;
  const usageSwiftInfo = `ErrlyReporter.shared.report(level: "info", message: "User successfully updated profile", metadata: ["userId": "swift-user-2"])`;
  const usageSwiftSimple = `ErrlyReporter.shared.report(level: "error", message: "Network request timed out", metadata: ["service": "ExternalAPI"], callStack: Thread.callStackSymbols) // Include stack trace if relevant`;

  /* --------------------------------------------------------------------
   * HELPER: COPY TO CLIPBOARD (Restored)
   * ------------------------------------------------------------------*/
  const handleCopy = (text: string, id: string) => {
    if (typeof window !== 'undefined' && (navigator as any).clipboard) {
      (navigator as any).clipboard.writeText(text).then(() => {
        setCopiedBlock(id);
        setTimeout(() => setCopiedBlock(null), 1500);
      }).catch((err: unknown) => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      console.warn('Clipboard API not available.');
    }
  };

  /* --------------------------------------------------------------------
   * SUMMARY
   * ------------------------------------------------------------------*/
  return (
    <div className="relative bg-gradient-to-br from-gray-950 via-black to-blue-950/60 text-gray-300 min-h-screen">
      <NavBar />
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-700/30 rounded-full blur-[150px] opacity-50 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/30 rounded-full blur-[120px] opacity-40 translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="relative container mx-auto max-w-7xl flex flex-col md:flex-row gap-8 px-4 pt-32 pb-24 z-10">
        <aside className="w-full md:w-auto flex-shrink-0 sticky top-20 self-start">
          <DocsSidebar />
        </aside>
        <main className="flex-1 min-w-0">
          <header className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-700/50">
            <a href="/" className="block"><img src="/lovable-uploads/errly-logo.png" alt="Errly logo" width={48} height={48} className="rounded-full shadow-md hover:opacity-90 transition-opacity"/></a>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Using the Errly SDK</h1>
          </header>

          {/* Installation */}
          <section id="installation" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Install</h2>
            {[{ cmd: installNpm, label: 'npm' }, { cmd: installYarn, label: 'yarn' }, { cmd: installPnpm, label: 'pnpm' }].map(({ cmd, label }) => (
              <div key={label} className="mb-4 relative group">
                <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }}>{cmd}</SyntaxHighlighter>
                <button onClick={() => handleCopy(cmd, label)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === label ? '✔' : '📋'}</button>
              </div>
            ))}
          </section>
          <Hr />

          {/* Quick Start Tabs */}
          <section id="quick-start" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Quick Start</h2>
            <div className="flex space-x-2 border-b border-gray-700/50 mb-6">
              {quickStartLanguages.map(lang => (
                <button key={lang} onClick={() => setActiveQuickStartLanguage(lang)} className={`py-2 px-4 -mb-px text-sm font-medium rounded-t-md ${activeQuickStartLanguage === lang ? 'border-b-2 border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{lang}</button>
              ))}
            </div>

            {/* JS/TS */}
            {activeQuickStartLanguage === 'JavaScript / TypeScript' && (
              <div className="relative group">
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{setupCode}</SyntaxHighlighter>
                <button onClick={() => handleCopy(setupCode, 'setupJSTS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupJSTS' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* Python */}
            {activeQuickStartLanguage === 'Python' && (
              <div className="relative group">
                <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{pythonQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(pythonQuickStart, 'setupPY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupPY' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* C# */}
            {activeQuickStartLanguage === 'C#' && (
              <div className="relative group">
                <SyntaxHighlighter language="csharp" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{csharpQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(csharpQuickStart, 'setupCS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupCS' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* Go */}
            {activeQuickStartLanguage === 'Go' && (
              <div className="relative group">
                <SyntaxHighlighter language="go" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{goQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(goQuickStart, 'setupGo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupGo' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* PHP */}
            {activeQuickStartLanguage === 'PHP' && (
              <div className="relative group">
                <SyntaxHighlighter language="php" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{phpQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(phpQuickStart, 'setupPHP')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupPHP' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* Ruby */}
            {activeQuickStartLanguage === 'Ruby' && (
              <div className="relative group">
                <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{rubyDirectQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(rubyDirectQuickStart, 'setupRubyDirect')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupRubyDirect' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* Swift */}
            {activeQuickStartLanguage === 'Swift' && (
              <div className="relative group">
                <SyntaxHighlighter language="swift" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{swiftQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(swiftQuickStart, 'setupSwift')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupSwift' ? '✔' : '📋'}</button>
              </div>
            )}

            <p className="mt-3 text-sm text-gray-400">Paste the relevant setup code into your project.</p>
          </section>
          <Hr />

          {/* Framework Examples */}
          <section id="framework-examples" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. Framework Examples</h2>
            <div className="flex space-x-2 border-b border-gray-700/50 mb-6">
              {frameworks.map(fw => (
                <button key={fw} onClick={() => setActiveFramework(fw)} className={`py-2 px-4 -mb-px text-sm font-medium rounded-t-md ${activeFramework === fw ? 'border-b-2 border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{fw}</button>
              ))}
            </div>
            <div className="relative group">
              {activeFramework === 'React' && <SyntaxHighlighter language="jsx" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '13px' }} showLineNumbers wrapLongLines>{exampleReact}</SyntaxHighlighter>}
              {activeFramework === 'Vanilla JS' && <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '13px' }} showLineNumbers wrapLongLines>{exampleVanilla}</SyntaxHighlighter>}
              {activeFramework === 'Node.js' && <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '13px' }} showLineNumbers wrapLongLines>{exampleNode}</SyntaxHighlighter>}
              <button onClick={() => handleCopy(activeFramework === 'React' ? exampleReact : activeFramework === 'Vanilla JS' ? exampleVanilla : exampleNode, 'framework')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'framework' ? '✔' : '📋'}</button>
            </div>
          </section>
          <Hr />

          {/* TL;DR Summary */}
          <section id="summary" className="mt-8 pt-6 border-t border-gray-700/50 bg-gray-900/50 rounded-lg p-6 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">TL;DR</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><code className="bg-gray-700 px-1 py-0.5 rounded text-xs">npm install errly-sdk</code> (or yarn/pnpm) for JS/TS.</li>
              <li>Copy the relevant Quick Start block (JS/TS, Python, or other languages) to your project.</li>
              <li>Call the appropriate function (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">console.text()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">logging</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ReportErrorAsync</code>, etc.) to send events.</li>
            </ol>
          </section>
          <Hr />

          {/* Usage Section */}
          <section id="usage" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Usage – Triggering Alerts</h2>

            {/* Usage Tabs */}
            <div className="flex space-x-2 border-b border-gray-700/50 mb-6">
              {usageLanguages.map(lang => (
                <button key={lang} onClick={() => setActiveUsageLanguage(lang)} className={`py-2 px-4 -mb-px text-sm font-medium rounded-t-md ${activeUsageLanguage === lang ? 'border-b-2 border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{lang}</button>
              ))}
            </div>

            {/* JavaScript Usage */}
            {activeUsageLanguage === 'JavaScript' && (
              <div>
                <p className="mb-6 text-sm text-gray-400">
                  Call <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">console.text()</code>. You can optionally provide a log level (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'error\'</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'warn\'</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'info\'</code>, or <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'log\'</code>), case-insensitive, as the first argument. If omitted, it defaults to <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'error\'</code>. The SDK also calls the corresponding original console method.
                </p>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error (Default Level)</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{usageErrorObject}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageErrorObject, 'usageErrorJS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorJS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending a Warning</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{usageWarn}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageWarn, 'usageWarnJS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageWarnJS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending Informational Log</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{usageInfo}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageInfo, 'usageInfoJS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageInfoJS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Logging Metadata (Default Error Level)</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{usageMetadata}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageMetadata, 'usageMetaJS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageMetaJS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Simple Message (Default Error Level)</h3>
                 <div className="relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{usageSimple}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageSimple, 'usageSimpleJS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageSimpleJS' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

             {/* Python Usage */}
            {activeUsageLanguage === 'Python' && (
              <div>
                <p className="mb-6 text-sm text-gray-400">
                  Use standard Python logging methods (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.error()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.warning()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.info()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.exception()</code>). Metadata can be passed via the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">extra</code> argument, nested within a dictionary under the key <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'extra_errly\'</code> (e.g., <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">extra=&lbrace;\'extra_errly\': &lbrace;\'user\': 123&rbrace;&rbrace;</code>). The Errly handler forwards these to the API.
                </p>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error (<code className="text-sm bg-gray-700 px-1 rounded">logging.exception</code>)</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonError}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usagePythonError, 'usageErrorPY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorPY' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending a Warning (<code className="text-sm bg-gray-700 px-1 rounded">logging.warning</code>)</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonWarn}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usagePythonWarn, 'usageWarnPY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageWarnPY' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending Informational Log (<code className="text-sm bg-gray-700 px-1 rounded">logging.info</code>)</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonInfo}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usagePythonInfo, 'usageInfoPY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageInfoPY' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Logging Metadata (<code className="text-sm bg-gray-700 px-1 rounded">logging.error</code>)</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonMetadata}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usagePythonMetadata, 'usageMetaPY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageMetaPY' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Simple Message (<code className="text-sm bg-gray-700 px-1 rounded">logging.error</code>)</h3>
                 <div className="relative group">
                  <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonSimple}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usagePythonSimple, 'usageSimplePY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageSimplePY' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

            {/* C# Usage */}
            {activeUsageLanguage === 'C#' && (
              <div>
                <p className="mb-6 text-sm text-gray-400">
                  Use the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ErrlyReporter.ReportErrorAsync</code> method. Provide the level (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"error\"</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"warn\"</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"info\"</code>), message, optional metadata dictionary, and optional exception object.
                </p>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="csharp" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageCSharpError}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageCSharpError, 'usageErrorCS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorCS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending a Warning</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="csharp" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageCSharpWarn}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageCSharpWarn, 'usageWarnCS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageWarnCS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending Informational Log</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="csharp" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageCSharpInfo}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageCSharpInfo, 'usageInfoCS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageInfoCS' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Simple Message</h3>
                <div className="relative group">
                  <SyntaxHighlighter language="csharp" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageCSharpSimple}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageCSharpSimple, 'usageSimpleCS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageSimpleCS' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

            {/* Go Usage */}
             {activeUsageLanguage === 'Go' && (
              <div>
                <p className="mb-6 text-sm text-gray-400">
                  Use the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ReportError</code> function (from the SDK or your implementation). Pass the level (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"error\"</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"warn\"</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"info\"</code>), message, optional metadata map, and a boolean indicating if it\'s an error (for potential stack tracing).
                </p>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="go" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageGoError}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageGoError, 'usageErrorGo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorGo' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending a Warning</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="go" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageGoWarn}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageGoWarn, 'usageWarnGo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageWarnGo' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending Informational Log</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="go" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageGoInfo}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageGoInfo, 'usageInfoGo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageInfoGo' ? '✔' : '📋'}</button>
                </div>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Simple Message</h3>
                <div className="relative group">
                  <SyntaxHighlighter language="go" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageGoSimple}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageGoSimple, 'usageSimpleGo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageSimpleGo' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

            {/* PHP Usage */}
            {activeUsageLanguage === 'PHP' && (
              <div>
                <p className="mb-6 text-sm text-gray-400">
                  Use the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">reportErrorToErrly</code> function. Pass the level (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'error\'</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'warn\'</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\'info\'</code>), message, optional metadata array, and optional Throwable exception object. Note: Examples assume the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">reportErrorToErrly</code> function from the Quick Start is available.
                </p>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error</h3>
                <div className="mb-6 relative group">
                  {/* PHP examples are combined */}
                  <SyntaxHighlighter language="php" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePhpError}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usagePhpError, 'usageErrorPHP')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorPHP' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

            {/* Ruby Usage */}
             {activeUsageLanguage === 'Ruby' && (
              <div>
                 <p className="mb-6 text-sm text-gray-400">
                   Use methods like <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ErrlyReporter.report(:level, message, metadata_hash, exception_object)</code>. Metadata is passed as a standard Ruby hash. Note: Examples assume the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ErrlyReporter</code> module from the Quick Start is available.
                 </p>
                <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error</h3>
                <div className="mb-6 relative group">
                  <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyDirectError}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageRubyDirectError, 'usageErrorRuby')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorRuby' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending a Warning</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyDirectWarn}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageRubyDirectWarn, 'usageWarnRuby')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageWarnRuby' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending Informational Log</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyDirectInfo}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageRubyDirectInfo, 'usageInfoRuby')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageInfoRuby' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Simple Message</h3>
                 <div className="relative group">
                  <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyDirectSimple}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageRubyDirectSimple, 'usageSimpleRuby')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageSimpleRuby' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

              {/* Swift Usage */}
             {activeUsageLanguage === 'Swift' && (
              <div>
                 <p className="mb-6 text-sm text-gray-400">
                   Use the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ErrlyReporter.shared.report</code> method. Provide the level (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"error\"</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"warn\"</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">\"info\"</code>), message, optional metadata dictionary, optional Error object, and optionally the call stack symbols (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">Thread.callStackSymbols</code>). Note: Examples assume the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ErrlyReporter</code> class from the Quick Start is available.
                 </p>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Critical Error</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="swift" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageSwiftError}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageSwiftError, 'usageErrorSwift')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageErrorSwift' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending a Warning</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="swift" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageSwiftWarn}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageSwiftWarn, 'usageWarnSwift')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageWarnSwift' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Sending Informational Log</h3>
                 <div className="mb-6 relative group">
                  <SyntaxHighlighter language="swift" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageSwiftInfo}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageSwiftInfo, 'usageInfoSwift')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageInfoSwift' ? '✔' : '📋'}</button>
                </div>
                 <h3 className="text-lg font-medium mb-3 text-gray-300">Example: Simple Message</h3>
                 <div className="relative group">
                  <SyntaxHighlighter language="swift" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageSwiftSimple}</SyntaxHighlighter>
                  <button onClick={() => handleCopy(usageSwiftSimple, 'usageSimpleSwift')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageSimpleSwift' ? '✔' : '📋'}</button>
                </div>
              </div>
            )}

          </section>
        </main>
      </div>
    </div>
  );
};

export default DocsPage;
