import React, { useState } from 'react';
// Import the syntax highlighter and a theme
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism/index.js';
import DocsSidebar from '@/components/DocsSidebar'; // Import the sidebar
// Removed Card and Separator imports as we're simplifying the structure for the black theme

// Simple horizontal rule for separation
const Hr = () => <hr className="my-8 border-gray-700/50" />;

const DocsPage: React.FC = () => {

  // Define available framework tabs
  const frameworks = ['React', 'Vanilla JS', 'Node.js']; // Add Node.js
  const [activeFramework, setActiveFramework] = useState(frameworks[0]);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null); // State for copy feedback

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

  // Added code strings for literal examples to make copying easier
  const usageWarn = `// Specify 'warn' as the level
console.text('warn', 'Configuration value looks suspicious.', { config: 'old_value', userId: 'admin' });

// This will call the original console.warn() and send a 'warn' level event to Errly.`;

  const usageInfo = `// Specify 'info' as the level
console.text('info', 'User logged in successfully.', { userId: 123 });

// This will call the original console.info() and send an 'info' level event to Errly.`;

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

  const exampleNode =
`// Import the necessary functions from the SDK
// Make sure you have Node.js v18+ for native fetch support
import { setKey, patch } from 'errly-sdk';

// --- Initialize Errly ---
// Set your project API key (obtainable from the Errly dashboard)
setKey('YOUR_ERRLY_PROJECT_API_KEY');
// Patch the console object to enable console.text()
patch();
// --- End Initialization ---

console.log('Errly SDK Initialized in Node.js');

// Example usage in a simple server or script
function criticalBackgroundTask() {
  try {
    // Simulate a task that might fail
    if (Math.random() < 0.1) { // 10% chance of failure
      throw new Error('Background task failed unexpectedly!');
    }
    console.log('Background task completed successfully.');
  } catch (error) {
    // Log the critical error to Errly
    console.text('Critical background task failure', { taskName: 'data-processing' }, error);
    // The original console.error is also called due to patch()
  }
}

// Run the task periodically or on trigger
setInterval(criticalBackgroundTask, 60000); // Run every minute
`;

  // Function to handle copying code to clipboard
  const handleCopy = (textToCopy: string, blockId: string) => {
    if (!navigator.clipboard) {
      // Fallback for environments without clipboard API (e.g., insecure contexts)
      console.warn('Clipboard API not available.');
      // Optionally, implement a textarea-based fallback here
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedBlock(blockId);
      setTimeout(() => {
        setCopiedBlock(null);
      }, 1500); // Reset after 1.5 seconds
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Optionally, provide user feedback about the failure
    });
  };

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
            <div className="relative group">
              <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }}>
                {installNpm}
              </SyntaxHighlighter>
              <button
                onClick={() => handleCopy(installNpm, 'installNpm')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                aria-label="Copy npm install command"
              >
                {copiedBlock === 'installNpm' ? <span className="text-xs">Copied!</span> : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                  </svg>
                )}
              </button>
            </div>
            <h3 className="text-lg font-medium mb-2 mt-4 text-gray-100">Using yarn:</h3>
            <div className="relative group">
              <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }}>
                {installYarn}
              </SyntaxHighlighter>
              <button
                onClick={() => handleCopy(installYarn, 'installYarn')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                aria-label="Copy yarn add command"
              >
                 {copiedBlock === 'installYarn' ? <span className="text-xs">Copied!</span> : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                  </svg>
                )}
              </button>
            </div>
            <h3 className="text-lg font-medium mb-2 mt-4 text-gray-100">Using pnpm:</h3>
            <div className="relative group">
              <SyntaxHighlighter language="bash" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }}>
                {installPnpm}
              </SyntaxHighlighter>
              <button
                onClick={() => handleCopy(installPnpm, 'installPnpm')}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                aria-label="Copy pnpm add command"
              >
                 {copiedBlock === 'installPnpm' ? <span className="text-xs">Copied!</span> : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                  </svg>
                )}
              </button>
            </div>
          </section>

          <Hr />

          <section id="setup" className="mb-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Step 2: Setup (Quick Start)</h2>
            <p className="text-base md:text-lg leading-relaxed mb-6">
              Integrate Errly into your JavaScript/TypeScript application:
            </p>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-100">Initialization Code:</h3>
              <div className="relative group">
                <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>
                  {setupCode}
                </SyntaxHighlighter>
                <button
                  onClick={() => handleCopy(setupCode, 'setupCode')}
                  className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                  aria-label="Copy setup code"
                >
                  {copiedBlock === 'setupCode' ? <span className="text-xs">Copied!</span> : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                    </svg>
                  )}
                </button>
              </div>
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
                <div className="relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>
                    {usageErrorObject}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => handleCopy(usageErrorObject, 'usageErrorObject')}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                    aria-label="Copy critical error example code"
                  >
                    {copiedBlock === 'usageErrorObject' ? <span className="text-xs">Copied!</span> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Sending a Warning</h4>
                 <div className="relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>
                    {usageWarn}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => handleCopy(usageWarn, 'usageWarn')}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                    aria-label="Copy warning example code"
                  >
                    {copiedBlock === 'usageWarn' ? <span className="text-xs">Copied!</span> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
               <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Sending Informational Log</h4>
                 <div className="relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>
                    {usageInfo}
                  </SyntaxHighlighter>
                   <button
                    onClick={() => handleCopy(usageInfo, 'usageInfo')}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                    aria-label="Copy info example code"
                  >
                    {copiedBlock === 'usageInfo' ? <span className="text-xs">Copied!</span> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Logging Metadata (Default Error Level)</h4>
                <div className="relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }} showLineNumbers wrapLongLines>
                    {usageMetadata}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => handleCopy(usageMetadata, 'usageMetadata')}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                    aria-label="Copy metadata example code"
                  >
                    {copiedBlock === 'usageMetadata' ? <span className="text-xs">Copied!</span> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium mb-1 text-gray-100">Example: Simple Message (Default Error Level)</h4>
                <div className="relative group">
                  <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '12.5px' }}>
                    {usageSimple}
                  </SyntaxHighlighter>
                  <button
                    onClick={() => handleCopy(usageSimple, 'usageSimple')}
                    className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                    aria-label="Copy simple message example code"
                  >
                    {copiedBlock === 'usageSimple' ? <span className="text-xs">Copied!</span> : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <Hr />

          <section id="framework-examples" className="mb-10 scroll-mt-24">
             <h2 className="text-2xl font-semibold mb-4 text-blue-400">Framework Examples</h2>
             <p className="text-base md:text-lg leading-relaxed mb-6">
               Example setup for common JavaScript environments. Choose your framework:
             </p>

             {/* Framework Tab Buttons */}
             <div className="flex space-x-2 mb-6 border-b border-gray-700/50">
               {frameworks.map((framework) => (
                 <button
                   key={framework}
                   onClick={() => setActiveFramework(framework)}
                   className={`py-2 px-4 -mb-px text-sm font-medium rounded-t-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                     activeFramework === framework
                       ? 'border-b-2 border-blue-400 text-blue-300'
                       : 'text-gray-400 hover:text-gray-200 hover:border-gray-500/50 border-b-2 border-transparent'
                   }`}
                 >
                   {framework}
                 </button>
               ))}
             </div>

             {/* Conditional Content */}
             <div className="space-y-8 mt-4">
               {activeFramework === 'React' && (
                 <div>
                   <h3 className="text-lg font-medium mb-2 text-gray-100">React (<code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">src/main.tsx</code>)</h3>
                   <p className="text-sm text-gray-400 mb-2">
                     Place initialization before rendering the root component.
                   </p>
                   <div className="relative group">
                    <SyntaxHighlighter language="jsx" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '14px' }} showLineNumbers wrapLongLines>
                       {exampleReact}
                     </SyntaxHighlighter>
                    <button
                      onClick={() => handleCopy(exampleReact, 'exampleReact')}
                      className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                      aria-label="Copy React example code"
                    >
                      {copiedBlock === 'exampleReact' ? <span className="text-xs">Copied!</span> : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                        </svg>
                      )}
                    </button>
                  </div>
                 </div>
               )}
               {activeFramework === 'Vanilla JS' && (
                 <div>
                   <h3 className="text-lg font-medium mb-2 text-gray-100">Vanilla JavaScript (<code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">main.js</code>)</h3>
                   <p className="text-sm text-gray-400 mb-2">
                     Initialize at the top of your main script file, assuming usage of a module bundler.
                   </p>
                   <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '14px' }} showLineNumbers wrapLongLines>
                       {exampleVanilla}
                     </SyntaxHighlighter>
                    <button
                      onClick={() => handleCopy(exampleVanilla, 'exampleVanilla')}
                      className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                      aria-label="Copy Vanilla JS example code"
                    >
                      {copiedBlock === 'exampleVanilla' ? <span className="text-xs">Copied!</span> : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                        </svg>
                      )}
                    </button>
                  </div>
                 </div>
               )}
               {activeFramework === 'Node.js' && (
                 <div>
                   <h3 className="text-lg font-medium mb-2 text-gray-100">Node.js (<code className="bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded text-xs font-semibold">server.js</code>)</h3>
                   <p className="text-sm text-gray-400 mb-2">
                     Initialize at the top of your server entry point (requires Node v18+ for <code className="bg-gray-700 text-gray-400 px-1 py-0.5 rounded text-xs font-semibold">fetch</code>).
                   </p>
                   <div className="relative group">
                    <SyntaxHighlighter language="javascript" style={atomDark} customStyle={{ padding: '1rem', borderRadius: '0.375rem', fontSize: '14px' }} showLineNumbers wrapLongLines>
                       {exampleNode}
                     </SyntaxHighlighter>
                    <button
                      onClick={() => handleCopy(exampleNode, 'exampleNode')}
                      className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors duration-150"
                      aria-label="Copy Node.js example code"
                    >
                      {copiedBlock === 'exampleNode' ? <span className="text-xs">Copied!</span> : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" />
                        </svg>
                      )}
                    </button>
                  </div>
                 </div>
               )}
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