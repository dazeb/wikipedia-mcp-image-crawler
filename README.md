# Wikipedia MCP Image Crawler

A Model Context Protocol (MCP) server for searching and retrieving images from Wikipedia Commons. This server provides tools to search for images and fetch detailed metadata through the Wikipedia API.

I created this tool because i needed images of Greek Philosopher's with the full attribution and licenses. This will search wikipedia only and download images that are in the public domain and free to use.

## Features

### Tools
- `wiki_image_search` - Search for images on Wikipedia Commons
  - Search by query with customizable result limits (1-50)
  - Returns image URLs, dimensions, MIME types, and sizes
  
- `wiki_image_info` - Get detailed information about specific images
  - Fetches comprehensive metadata including license and author
  - Returns full resolution URLs and description links

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or pnpm package manager

### Local Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/dazeb/wikipedia-mcp-image-crawler.git
   cd wikipedia-mcp-image-crawler
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the server:
   ```bash
   pnpm run build
   ```

### Integration with Claude

#### Claude Desktop App

Add the server configuration to your Claude config file:

**MacOS**:
```bash
vim ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux**:
```bash
vim ~/.config/Claude/claude_desktop_config.json
```

**Windows**:
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Add this configuration (adjust the path to where you cloned the repository):
```json
{
  "mcpServers": {
    "wikipedia-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/wikipedia-mcp-image-crawler/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### VSCode Extensions

##### Claude VSCode Extension

For the Claude VSCode extension, add to:

**MacOS**:
```bash
~/Library/Application\ Support/Code/User/globalStorage/anthropic.claude-vscode/settings/claude_mcp_settings.json
```

**Linux**:
```bash
~/.config/Code/User/globalStorage/anthropic.claude-vscode/settings/claude_mcp_settings.json
```

**Windows**:
```bash
%APPDATA%\Code\User\globalStorage\anthropic.claude-vscode\settings\claude_mcp_settings.json
```

For VS Code Insiders, replace `Code` with `Code - Insiders` in the paths above.

##### Cline VSCode Extension

For the Cline VSCode extension, add to:

**MacOS**:
```bash
~/Library/Application\ Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Linux**:
```bash
~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Windows**:
```bash
%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

For VS Code Insiders, replace `Code` with `Code - Insiders` in the paths above.

Add this configuration to the JSON file:
```json
{
  "mcpServers": {
    "wikipedia-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/wikipedia-mcp-image-crawler/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If the file already contains other MCP servers, add this entry to the existing `mcpServers` object.

## Usage

Once installed, the server provides two main tools:

### Image Search
Search for images matching a query:
```json
{
  "name": "wiki_image_search",
  "arguments": {
    "query": "golden gate bridge",
    "limit": 5
  }
}
```

### Image Information
Get detailed metadata for a specific image:
```json
{
  "name": "wiki_image_info",
  "arguments": {
    "title": "File:Golden Gate Bridge.jpg"
  }
}
```

## Development

### Running in Watch Mode
For development with auto-rebuild:
```bash
pnpm run watch
```

### Debugging
Since MCP servers communicate over stdio, use the MCP Inspector for debugging:
```bash
pnpm run inspector
```

This will provide a URL to access the debugging interface in your browser.
