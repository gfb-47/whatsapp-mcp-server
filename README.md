# WhatsApp MCP Server

## Overview
The WhatsApp MCP (Model Context Protocol) server is a Node.js application that enables programmatic interaction with the WhatsApp desktop application on macOS. Using AppleScript automation, it provides a simple interface for sending messages and checking WhatsApp status without requiring direct interaction with the WhatsApp UI.

## Features

### 1. Send Messages to Contacts
Send text messages to specific contacts in your WhatsApp contact list:
- Messages are delivered through your connected WhatsApp desktop application
- Supports proper formatting of messages including line breaks
- Uses AppleScript to automate the WhatsApp desktop interface

### 2. Check WhatsApp Status
Verify if the WhatsApp application is currently running:
- Returns the current running status of WhatsApp
- Helps prevent errors when attempting to send messages

### 3. List Recent Contacts (Limited)
Due to WhatsApp's privacy protections, this feature provides limited functionality:
- Informs users about WhatsApp's privacy limitations
- Requires exact contact names for messaging

## Technical Implementation

### Built With
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP server and stdio transport
- [Zod](https://github.com/colinhacks/zod) - Schema validation
- Node.js built-in modules (child_process, util, fs)
- AppleScript for macOS automation

### Architecture
- Uses the Model Context Protocol (MCP) for standardized tool communication
- Employs stdio transport for communication
- Executes AppleScript commands to interact with the WhatsApp desktop application
- Implements comprehensive error logging for debugging

## Requirements
- macOS operating system
- WhatsApp desktop application installed
- Node.js v14.0.0 or higher
- Internet connection

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/whatsapp-mcp-server.git

# Navigate to the project directory
cd whatsapp-mcp-server

# Install dependencies
npm install
```

## Usage

### Starting the Server
```bash
node index.js
```

## Integrating with Claude

To enable Claude to use the WhatsApp MCP server, follow these steps:

1. **Set up your MCP server**
   - Install and configure the WhatsApp MCP server as described above
   - Ensure the server is running properly on your local machine

2. **Configure Claude Desktop with your MCP tools**
   - Modify your `claude_desktop_config.json` file to include the WhatsApp MCP tools
   - This file is typically located in your Claude Desktop application configuration directory
   - Add the following configuration to register your WhatsApp MCP tools:

```json

{
  "mcpServers": [
    {
      "name": "whatsapp-mcp",
      "transport": {
        "command": "node",
        "args": ["path/to/your/index.js"]
      }
    }
  ]
}
```

3. **Define Tool Schemas**
   - Use the same schema definitions as in the MCP server code:
     - `send-whatsapp-message`: Requires contactName and message parameters
     - `check-whatsapp-status`: No parameters required
     - `list-recent-contacts`: No parameters required

4. **Test the Integration**
   - Create a test conversation with Claude
   - Ask Claude to send a WhatsApp message to a test contact
   - Verify that the message is sent successfully through the WhatsApp desktop app

5. **Deploy for Production Use**
   - Ensure your MCP server runs reliably
   - Consider setting up an auto-start mechanism for the server
   - Implement appropriate security measures for production usage

### MCP Tools Available

#### 1. send-whatsapp-message
Sends a message to a specified WhatsApp contact.

Parameters:
- `contactName`: Full name of the contact as it appears in WhatsApp
- `message`: Content of the message to send

Example usage (via MCP client):
```javascript
const response = await client.invoke("send-whatsapp-message", {
  contactName: "John Doe",
  message: "Hello, how are you today?"
});
```

#### 2. check-whatsapp-status
Checks if the WhatsApp application is currently running.

No parameters required.

Example usage (via MCP client):
```javascript
const response = await client.invoke("check-whatsapp-status", {});
```

#### 3. list-recent-contacts
Provides information about WhatsApp's privacy limitations for contact listing.

No parameters required.

Example usage (via MCP client):
```javascript
const response = await client.invoke("list-recent-contacts", {});
```

## Implementation Details

### AppleScript Automation
The server uses AppleScript to automate the WhatsApp desktop application:
- Activates the WhatsApp application
- Uses keyboard shortcuts to navigate the interface
- Searches for contacts by name
- Selects contacts using down arrow navigation
- Types and sends messages

### Error Handling
Comprehensive error handling and logging:
- Console error output
- File-based logging in `~/Library/Logs/whatsapp-mcp/`
- Graceful handling of AppleScript execution errors
- Process-level exception handling

## Using WhatsApp MCP Tools with Claude

Once you've integrated the WhatsApp MCP tools with Claude, you can use natural language to instruct Claude to:

### Send Messages
Example prompts:
- "Send a WhatsApp message to John saying I'll be 10 minutes late for our meeting"
- "Message Sarah on WhatsApp with the following text: Here's the document you requested"
- "Send 'Happy birthday!' to Mom on WhatsApp"

### Check WhatsApp Status
Example prompts:
- "Is WhatsApp running on my computer?"
- "Check if WhatsApp is active"
- "Verify WhatsApp status before sending a message"

### Get Contact Information
Example prompts:
- "Can you list my recent WhatsApp contacts?"
- "Show me who I've messaged recently on WhatsApp"

Claude will use the appropriate MCP tool based on your request and provide feedback on the result.

## Limitations
- Works only on macOS due to AppleScript dependency
- Requires WhatsApp desktop application to be installed
- Contact selection may be affected by WhatsApp UI changes
- Limited access to WhatsApp's contact list due to privacy protections
- Requires proper configuration of Claude to access your local MCP tools

## Security Considerations
- The server interacts with your personal WhatsApp account
- Messages are sent from your account and appear as sent by you
- Use in trusted environments only

## License
MIT

## Disclaimer
This project is not affiliated with WhatsApp Inc. or Meta Platforms, Inc. Use at your own discretion and in accordance with WhatsApp's terms of service.