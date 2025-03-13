#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Types for our Wikipedia API responses
interface WikiImageSearchResponse {
  query: {
    pages: {
      [key: string]: {
        title: string;
        imageinfo?: Array<{
          url: string;
          descriptionurl: string;
          mime: string;
          size: number;
          width: number;
          height: number;
        }>;
      };
    };
  };
}

interface WikiImageInfo {
  title: string;
  url: string;
  description_url: string;
  mime_type: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  license?: string;
  author?: string;
}

class WikipediaImageServer {
  private server: Server;
  private axiosInstance;
  private readonly API_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
  private readonly USER_AGENT = 'WikipediaMCPServer/1.0';

  constructor() {
    this.server = new Server(
      {
        name: 'wikipedia-image-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: this.API_ENDPOINT,
      headers: {
        'User-Agent': this.USER_AGENT,
      },
    });

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'wiki_image_search',
          description: 'Search for images on Wikipedia Commons',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for images',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (1-50)',
                minimum: 1,
                maximum: 50,
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'wiki_image_info',
          description: 'Get detailed information about a specific Wikipedia image',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title/filename of the image on Wikipedia Commons',
              },
            },
            required: ['title'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'wiki_image_search':
            return await this.handleImageSearch(request.params.arguments);
          case 'wiki_image_info':
            return await this.handleImageInfo(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Wikipedia API error: ${error.message}`
          );
        }
        throw error;
      }
    });
  }

  private async handleImageSearch(args: any) {
    if (!args.query || typeof args.query !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid query parameter');
    }

    const limit = Math.min(Math.max(args.limit || 10, 1), 50);

    const response = await this.axiosInstance.get<WikiImageSearchResponse>('', {
      params: {
        action: 'query',
        generator: 'search',
        gsrsearch: `File:${args.query}`,
        gsrlimit: limit,
        prop: 'imageinfo',
        iiprop: 'url|size|mime',
        format: 'json',
        origin: '*',
      },
    });

    const images = response.data.query?.pages || {};
    const results = Object.values(images)
      .filter((page) => page.imageinfo?.[0])
      .map((page) => {
        const info = page.imageinfo![0];
        return {
          title: page.title,
          url: info.url,
          mime_type: info.mime,
          dimensions: {
            width: info.width,
            height: info.height,
          },
          size: info.size,
        };
      });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleImageInfo(args: any) {
    if (!args.title || typeof args.title !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid title parameter');
    }

    const response = await this.axiosInstance.get('', {
      params: {
        action: 'query',
        titles: args.title,
        prop: 'imageinfo',
        iiprop: 'url|size|mime|extmetadata',
        format: 'json',
        origin: '*',
      },
    });

    const pages = response.data.query?.pages || {};
    const page = Object.values(pages)[0] as { 
      title?: string; 
      imageinfo?: Array<{
        url: string;
        descriptionurl: string;
        mime: string;
        size: number;
        width: number;
        height: number;
        extmetadata?: {
          License?: { value: string };
          Artist?: { value: string };
        };
      }>;
    } | undefined;
    
    if (!page?.imageinfo?.[0]) {
      throw new McpError(
        ErrorCode.InternalError,
        `Image not found: ${args.title}`
      );
    }

    const info = page.imageinfo[0];
    const metadata = info.extmetadata || {};

    const result: WikiImageInfo = {
      title: page.title || args.title,
      url: info.url,
      description_url: info.descriptionurl,
      mime_type: info.mime,
      size: info.size,
      dimensions: {
        width: info.width,
        height: info.height,
      },
      license: metadata.License?.value,
      author: metadata.Artist?.value,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Wikipedia Image MCP server running on stdio');
  }
}

const server = new WikipediaImageServer();
server.run().catch(console.error);
