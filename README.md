# HTMLove

An AI-powered HTML generator with instant deployment to Cloudflare Workers, built as a [deco](https://deco.chat) app example.

<img width="1341" height="940" alt="HTMLove screenshot" src="https://github.com/user-attachments/assets/3808de85-cfc2-4d27-922a-a65bbf7939d7" />

## What is HTMLove?

HTMLove is an example web application that combines AI-powered HTML generation with one-click deployment. Simply describe what you want to build, and HTMLove will generate clean, semantic HTML code that you can edit and deploy instantly.

## 🛠️ MCP Tools Created

This Deco app exposes two MCP (Model Context Protocol) tools:

### `GENERATE_HTML`
- **Description**: Generate valid HTML code from a textual prompt using Claude 4
- **Input**: Text description of desired HTML
- **Output**: Complete HTML code with explanation

### `DEPLOY_WORKER` 
- **Description**: Deploy HTML code as a Cloudflare Worker
- **Input**: Worker name and HTML code
- **Output**: Live URL at `https://[worker-name].deco.page`

## 🔧 Technologies & Integrations Used

- **AI Generation**: Claude 4 (via `DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT`)
- **Deployment**: Cloudflare Workers (via `DECO_CHAT_WORKSPACE_API.HOSTING_APP_DEPLOY`)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Deco Workers Runtime with Mastra workflows
- **Build Tools**: Vite, Wrangler

## 🚀 Getting Started

### Prerequisites

1. Install the Deco CLI:
```bash
deno install -Ar -g -n deco jsr:@deco/cli
```
[Full installation guide](https://github.com/deco-cx/chat?tab=readme-ov-file#%EF%B8%8F-using-the-cli)

2. Authenticate with Deco:
```bash
deco login
```

### Running the App

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Access the app at `http://localhost:8787`

## 📦 Project Structure

```
htmlove/
├── server/          # MCP server (Deco runtime + tools)
│   ├── main.ts      # Tool definitions and server setup
│   └── deco.gen.ts  # Generated types
├── view/            # React frontend
│   └── src/
│       ├── App.tsx  # Main application
│       └── lib/     # RPC client
└── package.json     # Workspace configuration
```

## 🎯 Example Deco App

This project demonstrates how to build a full-stack Deco app with:
- MCP tool creation and exposure
- Integration with Deco workspace APIs
- React frontend with typed RPC communication
- Deployment to Cloudflare Workers

Perfect as a starting point for building your own Deco apps!

---

Built with ❤️ using [Deco Platform](https://deco.chat)
