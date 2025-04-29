import React, { useState } from 'react';
// Import the syntax highlighter and a theme
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism/index.js';
import DocsSidebar from '../components/DocsSidebar.tsx';

// Simple horizontal rule for separation
const Hr = () => <hr className="my-8 border-gray-700/50" />;

const DocsPage: React.FC = () => {
  /* --------------------------------------------------------------------
   * CONSTANTS
   * ------------------------------------------------------------------*/
  const frameworks = ['React', 'Vanilla JS', 'Node.js'];
  const [activeFramework, setActiveFramework] = useState(frameworks[0]);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const quickStartLanguages = ['JavaScript / TypeScript', 'Python', 'Ruby'];
  const [activeQuickStartLanguage, setActiveQuickStartLanguage] = useState(quickStartLanguages[0]);
  const usageLanguages = ['JavaScript', 'Python', 'Ruby'];
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
   * QUICK-START SETUP – RUBY (Hypothetical)
   * ------------------------------------------------------------------*/
  const rubyQuickStart = `# ---- Errly Quick-Start (copy & paste) ----
# NOTE: This assumes a hypothetical 'errly-ruby-sdk' gem.
# The actual implementation details might vary.
require 'errly/sdk' # Hypothetical gem name
require 'net/http'
require 'json'
require 'uri'

module Errly
  class Config
    attr_accessor :api_key, :endpoint, :environment
    def initialize
      @endpoint = 'https://errly-api.vercel.app/api/errors' # Default endpoint
      @environment = nil
    end
  end

  class << self
    attr_writer :configuration

    def configuration
      @configuration ||= Config.new
    end

    def configure
      yield(configuration)
    end

    def report(level, message, metadata = {}, exception = nil)
      return unless configuration.api_key

      uri = URI.parse(configuration.endpoint)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')

      request = Net::HTTP::Post.new(uri.request_uri,
                                    'Content-Type' => 'application/json')

      payload = {
        apiKey: configuration.api_key, # API Key in the body
        level: level.to_s.downcase,
        message: message
      }
      payload[:metadata] = metadata if metadata && !metadata.empty?
      if exception
        payload[:stackTrace] = ([exception.message] + exception.backtrace).join("\n")
      end
      # Add environment if configured
      payload[:metadata][:environment] = configuration.environment if configuration.environment && payload[:metadata]

      request.body = payload.to_json

      begin
        response = http.request(request)
        # Optional: Log failure to send to Errly? Maybe only in dev mode.
        # puts "Errly response: #{response.code}" unless response.is_a?(Net::HTTPSuccess)
      rescue StandardError => e
        # puts "Failed to send report to Errly: #{e.message}" # Avoid noisy failures
      end
    end
  end

  # Simplified Logger integration (Hypothetical)
  class Logger
     # ... (A real SDK would likely wrap the standard Logger)
     def error(message, metadata = {}, exception = nil)
       Errly.report(:error, message, metadata, exception)
       # Also call original logger if wrapping one
     end
     def warn(message, metadata = {})
       Errly.report(:warn, message, metadata)
     end
     def info(message, metadata = {})
       Errly.report(:info, message, metadata)
     end
     # ... etc
  end
end

# --- Configuration ---
Errly.configure do |config|
  config.api_key = "YOUR_ERRLY_PROJECT_API_KEY"
  # config.endpoint = "YOUR_SELF_HOSTED_URL/api/errors" # Optional: Override endpoint
  # config.environment = "production"
end

# --- Usage Example (using the hypothetical Errly.report directly) ---
# Errly.report(:error, "Something broke!", { user_id: 123 }, StandardError.new("Oops"))

# --- Hypothetical Logger Setup ---
# $logger = Errly::Logger.new # Or wrap existing logger
# $logger.error("Failed via logger", { detail: 'abc' })

puts "Errly SDK (Hypothetical) configured!"
# ---- End Errly Setup ----`;

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
    console.log('Payment successful!'); // Regular logs are unaffected
  } catch (error) {
    // THIS is where you use Errly:
    // Log the critical error details to Errly for instant alerting.
    // This will ALSO call the original console.error, so you still see it in your standard logs.
    console.text('Critical Payment Failure!', { userId: 'user-123', amount }, error);
  }
}

processPayment(50000);`;

  const usageWarn = `// Specify 'warn' as the level
console.text('warn', 'Configuration value looks suspicious.', { config: 'old_value', userId: 'admin' });
// This will call the original console.warn() and send a 'warn' level event to Errly.`;

  const usageInfo = `// Specify 'info' as the level
console.text('info', 'User logged in successfully.', { userId: 123 });
// This will call the original console.info() and send an 'info' level event to Errly.`;

  const usageMetadata = `// You can log various types
console.text('User signup failed', { email: 'test@example.com' });`;

  const usageSimple = `console.text('Database connection lost');`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – PYTHON
   * ------------------------------------------------------------------*/
  const usagePythonError = `# Assuming logging is configured as per the Quick-Start
import logging

def process_payment(amount):
    try:
        # ... payment processing logic ...
        if amount > 10000:
            raise ValueError('Payment amount exceeds limit')
        logging.info('Payment successful!') # Regular logs are unaffected
    except Exception as e:
        # THIS is where you use Errly logging:
        # Log the critical error details to Errly for instant alerting.
        # Pass metadata using the 'extra_errly' key within the 'extra' dict.
        logging.exception(
            "Critical Payment Failure!",
            exc_info=e,
            extra={'extra_errly': {'userId': 'user-123', 'amount': amount}}
        )

process_payment(50000)`;

  const usagePythonWarn = `# Specify 'warn' as the level (using logging.warning)
# Pass metadata via 'extra_errly'
logging.warning(
    "Configuration value looks suspicious.",
    extra={'extra_errly': {'config': 'old_value', 'userId': 'admin'}}
)`;

  const usagePythonInfo = `# Specify 'info' as the level (using logging.info)
# Pass metadata via 'extra_errly'
logging.info(
    "User logged in successfully.",
    extra={'extra_errly': {'userId': 123}}
)`;

  const usagePythonMetadata = `# You can log various types in the 'extra_errly' dictionary
# The default level for logging.error or logging.exception is 'error'
logging.error(
    "User signup failed",
    extra={'extra_errly': {'email': 'test@example.com'}}
)`;

  const usagePythonSimple = `# Simple message (default error level, no metadata)
logging.error("Database connection lost")`;

  /* --------------------------------------------------------------------
   * USAGE EXAMPLES – RUBY (Hypothetical SDK)
   * ------------------------------------------------------------------*/
  const usageRubyError = `# Assuming Errly is configured as per the Quick-Start
# This example uses the hypothetical Errly.report directly

def process_payment(amount)
  begin
    # ... payment processing logic ...
    raise ArgumentError, 'Payment amount exceeds limit' if amount > 10000
    puts "Payment successful!" # Regular logs/output are unaffected
  rescue => error
    # THIS is where you use Errly:
    # Log the critical error details to Errly for instant alerting.
    Errly.report(
      :error, # Level
      'Critical Payment Failure!', # Message
      { user_id: 'user-123', amount: amount }, # Metadata hash
      error # Exception object (for stack trace)
    )
  end
end

process_payment(50000)`;

  const usageRubyWarn = `# Specify 'warn' as the level
Errly.report(:warn, 'Configuration value looks suspicious.', { config: 'old_value', user_id: 'admin' })`;

  const usageRubyInfo = `# Specify 'info' as the level
Errly.report(:info, 'User logged in successfully.', { user_id: 123 })`;

  const usageRubyMetadata = `# You can log various types in the metadata hash
# Default level is 'error' when calling .error on a hypothetical logger
# Using Errly.report directly:
Errly.report(:error, 'User signup failed', { email: 'test@example.com' })`;

  const usageRubySimple = `# Simple message (specify level, no metadata/exception)
Errly.report(:error, 'Database connection lost')`;

  /* --------------------------------------------------------------------
   * HELPER: COPY TO CLIPBOARD
   * ------------------------------------------------------------------*/
  const handleCopy = (text: string, id: string) => {
    if (typeof window !== 'undefined' && window.navigator?.clipboard) {
      window.navigator.clipboard.writeText(text).then(() => {
        setCopiedBlock(id);
        setTimeout(() => setCopiedBlock(null), 1500);
      }).catch((err: unknown) => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      console.warn('Clipboard API not available.');
    }
  };

  /* ====================================================================
   * RENDER
   * ==================================================================*/
  return (
    <div className="relative bg-gradient-to-br from-gray-950 via-black to-blue-950/60 text-gray-300 min-h-screen">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-700/30 rounded-full blur-[150px] opacity-50 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/30 rounded-full blur-[120px] opacity-40 translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="relative container mx-auto max-w-7xl flex flex-col md:flex-row gap-8 px-4 py-12 z-10">
        <aside className="w-full md:w-auto flex-shrink-0 sticky top-8 self-start">
          <DocsSidebar />
        </aside>
        <main className="flex-1 min-w-0">
          <header className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-700/50">
            <a href="/" className="block"><img src="/lovable-uploads/errly-logo.png" alt="Errly logo" width={48} height={48} className="rounded-full shadow-md hover:opacity-90 transition-opacity"/></a>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Using the Errly SDK</h1>
          </header>

          {/* Installation */}
          <section id="installation" className="mb-10 scroll-mt-24"> {/* Section 1 */}
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Install</h2>
            {[
              { cmd: installNpm, label: 'npm' },
              { cmd: installYarn, label: 'yarn' },
              { cmd: installPnpm, label: 'pnpm' },
            ].map(({ cmd, label }) => (
              <div key={label} className="mb-4 relative group">
                <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }}>{cmd}</SyntaxHighlighter>
                <button onClick={() => handleCopy(cmd, label)} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === label ? '✔' : '📋'}</button>
              </div>
            ))}
          </section>
          <Hr />

          {/* Quick Start (Combined with Tabs) */}
          <section id="quick-start" className="mb-10 scroll-mt-24"> {/* Section 2 */}
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Quick Start</h2>
            {/* Quick Start Language Tabs */}
            <div className="flex space-x-2 border-b border-gray-700/50 mb-6">
              {quickStartLanguages.map(lang => (
                <button key={lang} onClick={() => setActiveQuickStartLanguage(lang)} className={`py-2 px-4 -mb-px text-sm font-medium rounded-t-md ${activeQuickStartLanguage === lang ? 'border-b-2 border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{lang}</button>
              ))}
            </div>

            {/* JS/TS Quick Start */}
            {activeQuickStartLanguage === 'JavaScript / TypeScript' && (
              <div className="relative group">
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers>{setupCode}</SyntaxHighlighter>
                <button onClick={() => handleCopy(setupCode, 'setupJSTS')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupJSTS' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* Python Quick Start */}
            {activeQuickStartLanguage === 'Python' && (
              <div className="relative group">
                <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{pythonQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(pythonQuickStart, 'setupPY')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupPY' ? '✔' : '📋'}</button>
              </div>
            )}

            {/* Ruby Quick Start */}
            {activeQuickStartLanguage === 'Ruby' && (
              <div className="relative group">
                <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{rubyQuickStart}</SyntaxHighlighter>
                <button onClick={() => handleCopy(rubyQuickStart, 'setupRB')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'setupRB' ? '✔' : '📋'}</button>
              </div>
            )}

            <p className="mt-3 text-sm text-gray-400">Paste at the top of your application's entry point.</p>
          </section>
          <Hr />

          {/* Framework Examples */}
          <section id="framework-examples" className="mb-10 scroll-mt-24"> {/* Section 3 */}
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

          {/* SUMMARY */}
          <section id="summary" className="mt-8 pt-6 border-t border-gray-700/50 bg-gray-900/50 rounded-lg p-6 scroll-mt-24">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">TL;DR</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li><code className="bg-gray-700 px-1 py-0.5 rounded text-xs">npm install errly-sdk</code> (or yarn/pnpm)</li>
              <li>Copy the relevant Quick Start block (JS/TS, Python, Ruby) to the <em>top</em> of your project.</li>
              <li>Call <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">console.text()</code> (JS) or use Python/Ruby logging.</li>
            </ol>
          </section>

          {/* USAGE – TRIGGERING ALERTS */}
          <Hr />
          <section id="usage-examples" className="mb-10 scroll-mt-24"> {/* Section 4 */}
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Usage – Triggering Alerts</h2>
            <p className="mb-4">Call <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">console.text()</code> (JS), use standard <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">logging</code> (Python), or the Errly logger (Ruby) where you need to log events.</p>
            <p className="mb-6">
              <strong>JavaScript:</strong> You can optionally provide a log level (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">'error'</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">'warn'</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">'info'</code>, or <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">'log'</code>), case-insensitive, as the first argument. If omitted, it defaults to <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">'error'</code>. The SDK also calls the corresponding original console method.
            </p>
             <p className="mb-6">
              <strong>Python:</strong> Use standard Python <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">logging</code> methods (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.error()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.warning()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.info()</code>, <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">.exception()</code>). Metadata can be passed via the <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">extra</code> argument, nested within a dictionary under the key <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">'extra_errly'</code> (e.g., <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">extra=&#123;'extra_errly': &#123;'user': 123&#125;&#125;</code>). The Errly handler forwards these to the API.
            </p>
             <p className="mb-6">
              <strong>Ruby (Hypothetical):</strong> Use methods like <code className="bg-gray-700 px-1 py-0.5 rounded text-xs">Errly.report(:level, message, metadata_hash, exception_object)</code> or integrate with a custom logger. Metadata is passed as a standard Ruby hash. The API key is sent in the request body.
            </p>

            {/* Usage Language Tabs */}
            <div className="flex space-x-2 border-b border-gray-700/50 mb-6">
              {usageLanguages.map(lang => (
                <button key={lang} onClick={() => setActiveUsageLanguage(lang)} className={`py-2 px-4 -mb-px text-sm font-medium rounded-t-md ${activeUsageLanguage === lang ? 'border-b-2 border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>{lang}</button>
              ))}
            </div>

            {/* JavaScript Examples */}
            {activeUsageLanguage === 'JavaScript' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Critical Error (Default Level)</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageErrorObject}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageErrorObject, 'usageJSErrorObject')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageJSErrorObject' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Sending a Warning</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageWarn}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageWarn, 'usageJSWarn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageJSWarn' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Sending Informational Log</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageInfo}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageInfo, 'usageJSInfo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageJSInfo' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Logging Metadata (Default Error Level)</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageMetadata}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageMetadata, 'usageJSMeta')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageJSMeta' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Simple Message (Default Error Level)</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageSimple}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageSimple, 'usageJSSimple')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageJSSimple' ? '✔' : '📋'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Python Examples */}
            {activeUsageLanguage === 'Python' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Critical Error (with Exception)</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonError}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usagePythonError, 'usagePyError')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usagePyError' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Sending a Warning</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonWarn}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usagePythonWarn, 'usagePyWarn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usagePyWarn' ? '✔' : '📋'}</button>
                  </div>
                </div>
                 <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Sending Informational Log</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonInfo}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usagePythonInfo, 'usagePyInfo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usagePyInfo' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Logging Metadata</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonMetadata}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usagePythonMetadata, 'usagePyMeta')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usagePyMeta' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Simple Message</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="python" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usagePythonSimple}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usagePythonSimple, 'usagePySimple')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usagePySimple' ? '✔' : '📋'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Ruby Examples */}
            {activeUsageLanguage === 'Ruby' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Critical Error (with Exception)</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyError}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageRubyError, 'usageRbError')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageRbError' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Sending a Warning</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyWarn}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageRubyWarn, 'usageRbWarn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageRbWarn' ? '✔' : '📋'}</button>
                  </div>
                </div>
                 <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Sending Informational Log</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyInfo}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageRubyInfo, 'usageRbInfo')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageRbInfo' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Logging Metadata</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubyMetadata}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageRubyMetadata, 'usageRbMeta')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageRbMeta' ? '✔' : '📋'}</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2 text-gray-100">Example: Simple Message</h3>
                  <div className="relative group">
                    <SyntaxHighlighter language="ruby" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>{usageRubySimple}</SyntaxHighlighter>
                    <button onClick={() => handleCopy(usageRubySimple, 'usageRbSimple')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600">{copiedBlock === 'usageRbSimple' ? '✔' : '📋'}</button>
                  </div>
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