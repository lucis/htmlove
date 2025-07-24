// deno-lint-ignore-file require-await
import { withRuntime } from "@deco/workers-runtime";
import {
  createStepFromTool,
  createTool,
  createWorkflow,
} from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { Env as DecoEnv } from "./deco.gen.ts";

interface Env extends DecoEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const createGenerateHtmlTool = (env: Env) =>
  createTool({
    id: "GENERATE_HTML",
    description: "Generate valid HTML code from a textual prompt using Claude 4",
    inputSchema: z.object({ 
      prompt: z.string().describe("The textual prompt describing what HTML to generate") 
    }),
    outputSchema: z.object({ 
      html: z.string().describe("The generated HTML code"),
      explanation: z.string().describe("Brief explanation of the generated HTML")
    }),
    execute: async ({ context }) => {
      const response = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: [
          {
            role: "user",
            content: `Generate valid HTML code for the following request: ${context.prompt}. 
            
            Please create clean, semantic HTML that follows best practices. Include proper structure, accessibility attributes where appropriate, and use modern HTML5 elements.`
          }
        ],
        schema: {
          type: "object",
          properties: {
            html: {
              type: "string",
              description: "Valid HTML code that fulfills the prompt requirements"
            },
            explanation: {
              type: "string",
              description: "Brief explanation of the HTML structure and elements used"
            }
          },
          required: ["html", "explanation"]
        },
        model: "anthropic:claude-sonnet-4",
        maxTokens: 4000,
        temperature: 0.1
      });

      const generatedObject = response.object as { html?: string; explanation?: string } | undefined;

      return {
        html: generatedObject?.html || "<!-- Failed to generate HTML -->",
        explanation: generatedObject?.explanation || "HTML generation failed"
      };
    },
  });

const createDeployWorkerTool = (env: Env) =>
  createTool({
    id: "DEPLOY_WORKER",
    description: "Deploy HTML code as a Cloudflare Worker",
    inputSchema: z.object({
      workerName: z.string().describe("The worker name (slug format, lowercase with hyphens)"),
      htmlCode: z.string().describe("The HTML code to deploy")
    }),
    outputSchema: z.object({
      success: z.boolean().describe("Whether the deployment was successful"),
      url: z.string().describe("The deployed worker URL"),
      message: z.string().describe("Status message")
    }),
    execute: async ({ context }) => {
      try {
        // Create the worker script that serves the HTML
        const workerScript = `export default {
  async fetch() {
    return new Response(${JSON.stringify(context.htmlCode)}, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      }
    });
  }
};`;

        // Deploy using the hosting app deploy tool
        const deployResult = await env.DECO_CHAT_WORKSPACE_API.HOSTING_APP_DEPLOY({
          appSlug: context.workerName,
          files: [
            {
              path: "main.js",
              content: workerScript,
              asset: false
            },
            {
              path: "wrangler.jsonc",
              content: JSON.stringify({
                name: context.workerName,
                compatibility_date: "2025-01-01",
                main: "main.js"
              }, null, 2),
              asset: false
            }
          ],
          bundle: true,
          unlisted: true
        });

        // Construct the worker URL
        const workerUrl = `https://${context.workerName}.deco.page`;

        return {
          success: true,
          url: workerUrl,
          message: `Worker deployed successfully! Your HTML is now live at ${workerUrl}`
        };
      } catch (error) {
        console.error("Deployment error:", error);
        return {
          success: false,
          url: "",
          message: `Failed to deploy worker: ${error instanceof Error ? error.message : "Unknown error"}`
        };
      }
    },
  });

const fallbackToView = (viewPath: string = "/") => (req: Request, env: Env) => {
  const LOCAL_URL = "http://localhost:3000";
  const url = new URL(req.url);
  const useDevServer = (req.headers.get("origin") || req.headers.get("host"))
    ?.includes("localhost");

  const request = new Request(
    useDevServer
      ? new URL(`${url.pathname}${url.search}`, LOCAL_URL)
      : new URL(viewPath, req.url),
    req,
  );

  return useDevServer ? fetch(request) : env.ASSETS.fetch(request);
};

const { Workflow, ...runtime } = withRuntime<Env>({
  workflows: [],
  tools: [createGenerateHtmlTool, createDeployWorkerTool],
  fetch: fallbackToView("/"),
});

export { Workflow };

export default runtime;
