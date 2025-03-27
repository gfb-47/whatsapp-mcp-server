import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

// Setup error logging to help with debugging
const logError = (message: string, error: unknown) => {
  console.error(`ERROR: ${message}`, error ? error : '');

  // Optionally log to a file for persistent debugging
  try {
    const logDir = process.env.HOME + '/Library/Logs/whatsapp-mcp';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(
      `${logDir}/error.log`,
      `${new Date().toISOString()} - ${message} ${error ? JSON.stringify(error) : ''}\n`
    );
  } catch (e) {
    console.error("Failed to write to log file:", e);
  }
};

const execPromise = promisify(exec);

// Create the MCP server
console.error("Setting up MCP server...");
const server = new McpServer({
  name: "WhatsApp-Helper",
  version: "1.0.0"
});
console.error("MCP server created successfully");

// Helper function to execute AppleScript
async function runAppleScript(script: string) {
  try {
    const { stdout } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return stdout.trim();
  } catch (error) {
    console.error("AppleScript execution error:", error);
    throw new Error(`Failed to execute AppleScript: ${error}`);
  }
}

// Helper function to properly format messages for WhatsApp
function formatWhatsAppMessage(message: string) {
  // Replace normal line breaks with AppleScript line breaks
  // This ensures proper line breaking in WhatsApp
  return message
    .replace(/\n/g, '" & return & "')
    .replace(/"/g, '\\"');
}

// Improved function to send WhatsApp messages with minimal delays
server.tool(
  "send-whatsapp-message",
  "Send a message to a contact on WhatsApp",
  {
    contactName: z.string().describe("Full name of the contact as it appears in WhatsApp"),
    message: z.string().describe("Message content to send"),
  },
  async ({ contactName, message }) => {
    try {
      // Format the message for proper line breaks
      const formattedMessage = formatWhatsAppMessage(message);

      // Optimized AppleScript with minimal delays
      const appleScript = `
        tell application "WhatsApp" to activate
        delay 1 -- Reduced from 4 to 1
        
        tell application "System Events"
          tell process "WhatsApp"
            -- Access the search field
            try
              -- Keyboard shortcut for search
              keystroke "f" using {command down}
              delay 0.5 -- Reduced from 2 to 0.5
              
              -- Clear any existing text
              keystroke "a" using {command down}
              keystroke (ASCII character 8) -- Backspace
              delay 0.5 -- Reduced from 1.5 to 0.5
              
              -- Type the contact name
              keystroke "${contactName.replace(/"/g, '\\"')}"
              
              -- Give time for search results to populate
              delay 1.5 -- Reduced from 6 to 1.5
              
              -- Contact selection method
              keystroke (ASCII character 31) -- first down arrow
              delay 0.3 -- Reduced from 1 to 0.3
              keystroke (ASCII character 31) -- second down arrow
              delay 0.3 -- Reduced from 1 to 0.3
              keystroke return -- press enter
              delay 0.8 -- Reduced from 3 to 0.8
              
              -- Type and send the message
              keystroke "${formattedMessage}"
              delay 0.5 -- Reduced from 2 to 0.5
              
              -- Send the message
              keystroke return
              delay 0.3 -- Reduced from 1 to 0.3
              
              return "Message sent using optimized timing"
            on error errMsg
              return "Failed to send message: " & errMsg
            end try
          end tell
        end tell
      `;

      const result = await runAppleScript(appleScript);

      return {
        content: [
          {
            type: "text",
            text: `Message sent to ${contactName}: "${message}"`,
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error sending message: ${error}`,
          }
        ],
        isError: true
      };
    }
  }
);

// Tool to check if WhatsApp is currently running
server.tool(
  "check-whatsapp-status",
  "Check if WhatsApp is currently running",
  {},
  async () => {
    try {
      const appleScript = `
        tell application "System Events"
          return (exists process "WhatsApp")
        end tell
      `;

      const result = await runAppleScript(appleScript);
      const isRunning = result.toLowerCase() === 'true';

      return {
        content: [
          {
            type: "text",
            text: isRunning
              ? "WhatsApp is currently running."
              : "WhatsApp is not currently running. Please start WhatsApp before trying to send messages.",
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error checking WhatsApp status: ${error}`,
          }
        ],
        isError: true
      };
    }
  }
);

// Tool to list recent WhatsApp contacts (simplified version)
server.tool(
  "list-recent-contacts",
  "List recently contacted people on WhatsApp (simplified)",
  {},
  async () => {
    try {
      return {
        content: [
          {
            type: "text",
            text: "Due to WhatsApp's privacy protections, listing contacts programmatically is limited. " +
              "Please specify the exact contact name when sending messages.",
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing contacts: ${error}`,
          }
        ],
        isError: true
      };
    }
  }
);

// Connect to stdio transport
async function main() {
  try {
    console.error("Starting WhatsApp MCP Server...");

    // Create transport with error handling
    const transport = new StdioServerTransport();

    transport.onerror = (error) => {
      logError("Transport error occurred", error);
    };

    transport.onclose = () => {
      console.error("Transport closed");
    };

    // Connect with error handling
    await server.connect(transport);

    console.error("WhatsApp MCP Server is running");

    // Keep the process alive
    process.on('uncaughtException', (err) => {
      logError('Uncaught exception', err);
    });

    process.on('unhandledRejection', (reason) => {
      logError('Unhandled rejection', reason);
    });

  } catch (error) {
    logError("Error starting server", error);
    setTimeout(() => process.exit(1), 1000);
  }
}

// Start the server
console.error("Initializing WhatsApp MCP Server");
main().catch(err => {
  logError("Fatal error in main", err);
  setTimeout(() => process.exit(1), 1000);
});