import React from 'react';
// Import the syntax highlighter and a theme
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism/index.js';
import DocsSidebar from '@/components/DocsSidebar'; // Import the sidebar
// Removed Card and Separator imports as we're simplifying the structure for the black theme

// Simple horizontal rule for separation
const Hr = () => <hr className="my-8 border-gray-700/50" />;

const DocsPage: React.FC = () => {

  // Define code strings separately for clarity
  const installNpm = `npm install errly-sdk`;
  const installYarn = `yarn add errly-sdk`;
  const installPnpm = `pnpm add errly-sdk`;

  const setupCode = 
`// Import the necessary functions from the SDK
import { setKey, patch } from 'errly-sdk';

// --- Initialization (Run this once, early in your app's lifecycle) ---

// 1. Set your unique Errly Project API Key (Get this from your Errly dashboard)
setKey('YOUR_ERRLY_PROJECT_API_KEY');

// 2. Patch the global console object to add the \`console.text\` method
//    This needs to run before your first call to console.text()
patch();

// --- End of Errly Initialization ---

console.log("Errly SDK is ready!");`;

  const usageSimple = `console.text('Database connection lost');`;

  const usageErrorObject = 
`function processPayment(amount: number) {
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

  const usageMetadata = 
`// You can log various types
console.text('User signup failed', { email: 'test@example.com' });`;

  const exampleReact = 
`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setKey, patch } from 'errly-sdk'; // Import Errly functions

// --- Initialize Errly ---
// Set your project API key (obtainable from the Errly dashboard)
setKey('YOUR_ERRLY_PROJECT_API_KEY'); 
// Patch the console object to enable console.text()
patch();
// --- End Initialization ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`;

  const exampleVanilla = 
`import { setKey, patch } from 'errly-sdk'; // Import Errly functions

// --- Initialize Errly ---
// Set your project API key (obtainable from the Errly dashboard)
setKey('YOUR_ERRLY_PROJECT_API_KEY');
// Patch the console object to enable console.text()
patch();
// --- End Initialization ---


// Your regular JavaScript code...
function doSomething() {
  try {
    // ... some operation that might fail ...
    performPotentiallyFailingOperation(); 
  } catch (error) {
    // Log the error to Errly if the operation fails
    console.text("Error in doSomething:", error);
  }
}

// Example: Attach the function to a button click
document.getElementById('myButton')?.addEventListener('click', doSomething);

// Placeholder for the potentially failing operation
function performPotentiallyFailingOperation() {
  // Simulate an error condition for demonstration
  if (Math.random() < 0.5) { 
    throw new Error("Simulated failure in operation");
  }
  console.log("Operation succeeded (simulation)."); 
}

// Ensure the button exists in your HTML, e.g., <button id="myButton">Do Something</button>
// ...`;

  return (
    /* Removed overflow-x-hidden from here */
    <div className="relative bg-gradient-to-br from-gray-950 via-black to-blue-950/60 text-gray-300 min-h-screen">
      
      {/* New wrapper JUST for glows, with overflow clipping */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {/* Subtle Glow Effects are now INSIDE the clipping container */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-700/30 rounded-full blur-[150px] opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/30 rounded-full blur-[120px] opacity-40 translate-x-1/4 translate-y-1/4"></div>
      </div>

      {/* Main layout container - Ensure it has relative positioning and positive z-index */}
      <div className="relative container mx-auto max-w-7xl flex flex-col md:flex-row gap-8 px-4 py-12 z-10">
        
        {/* Sidebar Container - Apply sticky positioning HERE */}
        <div className="w-full md:w-auto flex-shrink-0 sticky top-8 self-start">
          <DocsSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-700/50">
            {/* Wrap logo in link to homepage */} 
            <a href="/" className="block flex-shrink-0">
              <img
                  src="/lovable-uploads/errly-logo.png"
                  alt="Errly Logo - Home"
                  width={48} // Increased size
                  height={48} // Increased size
                  className="rounded-full shadow-md hover:opacity-90 transition-opacity"
              />
            </a>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Using the Errly SDK</h1>
          </div>

          {/* Sections with scroll-mt for sticky header offset */}
          <section id="introduction" className="mb-10 scroll-mt-24">
             <h2 className="text-2xl font-semibold mb-4 text-blue-400">What is Errly?</h2>
              <div className="text-base md:text-lg leading-relaxed space-y-4">
                <p>
                  The official JavaScript SDK for Errly. Errly provides simple, instant error alerting via SMS and voice calls, focused on preventing downtime for developers, startups, and small teams.
                </p>
                <p>
                  This SDK captures logs sent via a special <code className="bg-gray-700 text-blue-300 px-1.5 py-0.5 rounded text-sm font-semibold">console.text()</code> method. It forwards them to the Errly API for alerting and analysis, allowing you to specify the severity level (like error, warn, info, or log).
                </p>
              </div>
          </section>

          <Hr />

          <section id="installation" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Step 1: Installation</h2>
            <p className="text-base md:text-lg leading-relaxed mb-4">
              Add the Errly SDK package using:
            </p>
            <h3 className="text-lg font-medium mb-2 text-gray-100">Using npm:</h3>
            <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }}>
              {installNpm}
            </SyntaxHighlighter>
            <h3 className="text-lg font-medium mb-2 mt-4 text-gray-100">Using yarn:</h3>
            <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }}>
              {installYarn}
            </SyntaxHighlighter>
            <h3 className="text-lg font-medium mb-2 mt-4 text-gray-100">Using pnpm:</h3>
            <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }}>
              {installPnpm}
            </SyntaxHighlighter>
          </section>

          <Hr />

          <section id="setup" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Step 2: Setup (Quick Start)</h2>
            <p className="text-base md:text-lg leading-relaxed mb-6">
              Integrate Errly into your JavaScript/TypeScript application:
            </p>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-100">Initialization Code:</h3>
              <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                {setupCode}
              </SyntaxHighlighter>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-100">Where to put this setup code?</h3>
              <ul className="list-disc list-inside space-y-3 text-base md:text-lg">
                <li>
                  <strong>Vanilla JavaScript:</strong> At the beginning of your main JS file.
                </li>
                <li>
                  <strong>React / Next.js (Client):</strong> In your main app entry file (e.g., <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">src/main.tsx</code>) before rendering.
                </li>
                <li>
                  <strong>Node.js / Next.js (Server):</strong> In your server entry point. Ensure Node.js v18+ for <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">fetch</code>.
                </li>
              </ul>
            </div>
          </section>

          <Hr />

          <section id="usage" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Step 3: Usage - Triggering Alerts</h2>
            <p className="text-base md:text-lg leading-relaxed mb-2">
              Call <code className="bg-gray-700 text-blue-300 px-1.5 py-0.5 rounded text-sm font-semibold">console.text()</code> where you need to log events to Errly.
            </p>
            <p className="text-base md:text-lg leading-relaxed mb-6">
              You can optionally provide a log level (<code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">'error'</code>, <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">'warn'</code>, <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">'info'</code>, or <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">'log'</code>, case-insensitive) as the first argument. If omitted, it defaults to <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">'error'</code>. The SDK will also call the corresponding original console method (e.g., <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">console.error</code>, <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">console.warn</code>) for standard browser/Node.js logging.
            </p>
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Critical Error (Default Level)</h4>
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                  {usageErrorObject}
                </SyntaxHighlighter>
              </div>
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Sending a Warning</h4>
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                  {`// Specify 'warn' as the level\nconsole.text('warn', 'Configuration value looks suspicious.', { config: 'old_value', userId: 'admin' });\n\n// This will call the original console.warn() and send a 'warn' level event to Errly.`}
                </SyntaxHighlighter>
              </div>
               <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Sending Informational Log</h4>
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                  {`// Specify 'info' as the level\nconsole.text('info', 'User logged in successfully.', { userId: 123 });\n\n// This will call the original console.info() and send an 'info' level event to Errly.`}
                </SyntaxHighlighter>
              </div>
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Logging Metadata (Default Error Level)</h4>
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                  {usageMetadata}
                </SyntaxHighlighter>
              </div>
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Simple Message (Default Error Level)</h4>
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }}>
                  {usageSimple}
                </SyntaxHighlighter>
              </div>
            </div>
          </section>

          <Hr />

          <section id="framework-examples" className="mb-10 scroll-mt-24">
             <h2 className="text-2xl font-semibold mb-4 text-blue-400">Framework Examples</h2>
             <p className="text-base md:text-lg leading-relaxed mb-6">
               Example setup for common JavaScript environments.
             </p>
             <div className="space-y-8">
               <div>
                 <h3 className="text-lg font-medium mb-2 text-gray-100">React (<code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">src/main.tsx</code>)</h3>
                 <p className="text-sm text-gray-400 mb-2">
                   Place initialization before rendering the root component.
                 </p>
                 <SyntaxHighlighter language="jsx" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                   {exampleReact}
                 </SyntaxHighlighter>
               </div>
               <div>
                 <h3 className="text-lg font-medium mb-2 text-gray-100">Vanilla JavaScript (<code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">main.js</code>)</h3>
                 <p className="text-sm text-gray-400 mb-2">
                   Initialize at the top of your main script file, assuming usage of a module bundler.
                 </p>
                 <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem' }} showLineNumbers wrapLongLines>
                   {exampleVanilla}
                 </SyntaxHighlighter>
               </div>
             </div>
          </section>

          <Hr />

          <section id="summary" className="mt-8 pt-6 border-t border-gray-700/50 bg-gray-900/50 rounded-lg p-6 scroll-mt-24">
             <h2 className="text-xl font-semibold mb-4 text-blue-400">Quick Summary</h2>
             <ul className="list-decimal list-inside space-y-2 text-base">
               <li>Install: <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">npm install errly-sdk</code></li>
               <li>Import <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">setKey</code>, <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">patch</code> from <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">errly-sdk</code>.</li>
               <li>Call <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">setKey('YOUR_ERRLY_PROJECT_API_KEY')</code>.</li>
               <li>Call <code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">patch()</code>.</li>
               <li>Use <code className="bg-gray-700 text-blue-300 px-1.5 py-0.5 rounded text-xs font-semibold">console.text([level], ...)</code> to log events! (Level defaults to 'error').</li>
             </ul>
          </section>

        </main>
      </div>
    </div>
  );
};

export default DocsPage; 