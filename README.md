<p align="center">
  <img src="apps/sim/public/static/pulse.png" alt="247 Workforce Logo" width="500"/>
</p>

<p align="center">
  <a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License: Apache-2.0"></a>
  <a href="https://discord.gg/Hr4UWYEcTT"><img src="https://img.shields.io/badge/Discord-Join%20Server-7289DA?logo=discord&logoColor=white" alt="Discord"></a>
  <a href="https://x.com/247workforce"><img src="https://img.shields.io/twitter/follow/247workforce?style=social" alt="Twitter"></a>
  <a href="https://github.com/247workforce/workforce/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome"></a>
  <a href="https://docs.247workforce.com"><img src="https://img.shields.io/badge/Docs-visit%20documentation-blue.svg" alt="Documentation"></a>
</p>

<p align="center">
  <strong>247 Workforce</strong> is a lightweight, user-friendly platform for building AI agent workflows.
</p>

<p align="center">
  <img src="apps/sim/public/static/demo.gif" alt="247 Workforce Demo" width="800"/>
</p>

## Getting Started

1. Use our [cloud-hosted version](https://247workforce.com)
2. Self-host using one of the methods below

## Self-Hosting Options

### Option 1: NPM Package (Simplest)

The easiest way to run 247 Workforce locally is using our [NPM package](https://www.npmjs.com/package/247-workforce-cli?activeTab=readme):

```bash
npx 247-workforce-cli
```

After running these commands, open [http://localhost:3000/](http://localhost:3000/) in your browser.

#### Options

- `-p, --port <port>`: Specify the port to run 247 Workforce on (default: 3000)
- `--no-pull`: Skip pulling the latest Docker images

#### Requirements

- Docker must be installed and running on your machine

### Option 2: Docker Compose

```bash
# Clone the repository
git clone https://github.com/247workforce/workforce.git

# Navigate to the project directory
cd workforce

# Start 247 Workforce
docker compose -f docker-compose.prod.yml up -d
```

## Features

- **Visual Workflow Builder**: Drag-and-drop interface for creating AI agent workflows
- **AI Agent Automation**: Build intelligent agents that can automate complex tasks
- **Real-time Collaboration**: Work together with your team in real-time
- **Extensive Tool Library**: Access to hundreds of pre-built tools and integrations
- **Custom Blocks**: Create your own custom blocks and tools
- **Deployment**: Deploy your workflows with a single click
- **Analytics**: Monitor and analyze your workflow performance

## Documentation

1. Pull models using our helper script:

```bash
./apps/sim/scripts/ollama_docker.sh pull <model_name>
```

2. Start Sim Studio with local model support:

```bash
# With NVIDIA GPU support
docker compose --profile local-gpu -f docker-compose.ollama.yml up -d

# Without GPU (CPU only)
docker compose --profile local-cpu -f docker-compose.ollama.yml up -d

# If hosting on a server, update the environment variables in the docker-compose.prod.yml file to include the server's public IP then start again (OLLAMA_URL to i.e. http://1.1.1.1:11434)
docker compose -f docker-compose.prod.yml up -d
```

### Option 3: Dev Containers

1. Open VS Code with the [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project and click "Reopen in Container" when prompted
3. Run `bun run dev:full` in the terminal or use the `sim-start` alias
   - This starts both the main application and the realtime socket server

### Option 4: Manual Setup

**Requirements:**
- [Bun](https://bun.sh/) runtime
- PostgreSQL 12+ with [pgvector extension](https://github.com/pgvector/pgvector) (required for AI embeddings)

**Note:** Sim Studio uses vector embeddings for AI features like knowledge bases and semantic search, which requires the `pgvector` PostgreSQL extension.

1. Clone and install dependencies:

```bash
git clone https://github.com/simstudioai/sim.git
cd sim
bun install
```

2. Set up PostgreSQL with pgvector:

You need PostgreSQL with the `vector` extension for embedding support. Choose one option:

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL with pgvector extension
docker run --name simstudio-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=simstudio \
  -p 5432:5432 -d \
  pgvector/pgvector:pg17
```

**Option B: Manual Installation**
- Install PostgreSQL 12+ and the pgvector extension
- See [pgvector installation guide](https://github.com/pgvector/pgvector#installation)

3. Set up environment:

```bash
cd apps/sim
cp .env.example .env  # Configure with required variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL)
```

Update your `.env` file with the database URL:
```bash
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/simstudio"
```

4. Set up the database:

```bash
bunx drizzle-kit migrate 
```

5. Start the development servers:

**Recommended approach - run both servers together (from project root):**

```bash
bun run dev:full
```

This starts both the main Next.js application and the realtime socket server required for full functionality.

**Alternative - run servers separately:**

Next.js app (from project root):
```bash
bun run dev
```

Realtime socket server (from `apps/sim` directory in a separate terminal):
```bash
cd apps/sim
bun run dev:sockets
```

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [Better Auth](https://better-auth.com)
- **UI**: [Shadcn](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Flow Editor**: [ReactFlow](https://reactflow.dev/)
- **Docs**: [Fumadocs](https://fumadocs.vercel.app/)
- **Monorepo**: [Turborepo](https://turborepo.org/)
- **Realtime**: [Socket.io](https://socket.io/)
- **Background Jobs**: [Trigger.dev](https://trigger.dev/)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.247workforce.com](https://docs.247workforce.com)
- **Discord**: [Join our community](https://discord.gg/Hr4UWYEcTT)
- **Twitter**: [@247workforce](https://x.com/247workforce)
- **GitHub Issues**: [Report bugs or request features](https://github.com/247workforce/workforce/issues)