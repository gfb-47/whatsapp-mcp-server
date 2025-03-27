import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
// Setup error logging to help with debugging
const logError = (message, error) => {
    console.error(`ERROR: ${message}`, error ? error : '');
    // Optionally log to a file for persistent debugging
    try {
        const logDir = process.env.HOME + '/Library/Logs/whatsapp-mcp';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(`${logDir}/error.log`, `${new Date().toISOString()} - ${message} ${error ? JSON.stringify(error) : ''}\n`);
    }
    catch (e) {
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
async function runAppleScript(script) {
    try {
        const { stdout } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
        return stdout.trim();
    }
    catch (error) {
        console.error("AppleScript execution error:", error);
        throw new Error(`Failed to execute AppleScript: ${error.message}`);
    }
}
// Tool to send a WhatsApp message
server.tool("send-whatsapp-message", "Send a message to a contact on WhatsApp", {
    contactName: z.string().describe("Full name of the contact as it appears in WhatsApp"),
    message: z.string().describe("Message content to send"),
}, async ({ contactName, message }) => {
    try {
        // AppleScript to interact with WhatsApp Desktop app
        const appleScript = `
        tell application "WhatsApp" to activate
        delay 1
        tell application "System Events"
          tell process "WhatsApp"
            -- Search for the contact
            keystroke "s" using {command down}
            delay 0.5
            keystroke "${contactName.replace(/"/g, '\\"')}"
            delay 1
            -- Press Enter to select the first contact from search results
            key code 36
            delay 1
            -- Type and send the message
            keystroke "${message.replace(/"/g, '\\"')}"
            delay 0.5
            key code 36 -- Press Enter to send
          end tell
        end tell
      `;
        await runAppleScript(appleScript);
        return {
            content: [
                {
                    type: "text",
                    text: `Message sent to ${contactName}: "${message}"`,
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error sending message: ${error.message}`,
                }
            ],
            isError: true
        };
    }
});
// Tool to check if WhatsApp is running
server.tool("check-whatsapp-status", "Check if WhatsApp is currently running", {}, async () => {
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error checking WhatsApp status: ${error.message}`,
                }
            ],
            isError: true
        };
    }
});
// Tool to list recent WhatsApp contacts (this is a simplified version as full access may be limited)
server.tool("list-recent-contacts", "List recently contacted people on WhatsApp (simplified)", {}, async () => {
    try {
        // This is a simulated result since direct access to WhatsApp's contact list
        // through AppleScript is limited
        return {
            content: [
                {
                    type: "text",
                    text: "Due to WhatsApp's privacy protections, listing contacts programmatically is limited. " +
                        "Please specify the exact contact name when sending messages.",
                }
            ]
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error listing contacts: ${error.message}`,
                }
            ],
            isError: true
        };
    }
});
// Connect to stdio transport
async function main() {
    try {
        console.error("Starting WhatsApp MCP Server...");
        // Create a more robust transport with error handling
        const transport = new StdioServerTransport();
        transport.onerror = (error) => {
            logError("Transport error occurred", error);
        };
        transport.onclose = () => {
            console.error("Transport closed");
        };
        // Log server info before connection, inspecting what properties are available
        try {
            console.error(`Server properties available: ${Object.keys(server).join(', ')}`);
            console.error(`Server instance: ${server.constructor.name}`);
            // Don't try to access properties that might not exist
        }
        catch (err) {
            console.error("Could not log server info, but continuing");
        }
        // Connect with additional error handling
        await server.connect(transport);
        console.error("WhatsApp MCP Server is running");
        // Keep the process alive
        process.on('uncaughtException', (err) => {
            logError('Uncaught exception', err);
        });
        process.on('unhandledRejection', (reason) => {
            logError('Unhandled rejection', reason);
        });
    }
    catch (error) {
        logError("Error starting server", error);
        // Give time for the error to be logged
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
}
// Add startup logging
console.error("Initializing WhatsApp MCP Server");
main().catch(err => {
    logError("Fatal error in main", err);
    // Give time for the error to be logged
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
