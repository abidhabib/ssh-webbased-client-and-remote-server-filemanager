# Web SSH Client

A modern, full-featured web-based SSH remote client with integrated file manager for secure server management directly from your browser.

## Features

### Terminal (Left Panel)
- **Multi-tab sessions** - Manage multiple SSH connections simultaneously
- **xterm.js integration** - Full terminal emulation with WebGL acceleration
- **Split panes** - 2×2 grid layout for advanced multitasking
- **Session persistence** - Redis-backed session store for reconnection
- **Search functionality** - Regex support for finding text in terminal output
- **Multiple themes** - Dracula, Monokai, Solarized, and more
- **Keyboard shortcuts** - Vim/Emacs mode support
- **Command palette** - VS Code-style quick actions (Ctrl+Shift+P)

### File Manager (Right Panel)
- **Dual-pane interface** - Orthodox file manager like Midnight Commander
- **Remote SFTP browser** - Navigate and manage remote files
- **Local browser files** - Native File System Access API integration
- **Drag & Drop transfers** - Intuitive file upload/download
- **Batch operations** - Copy, move, delete multiple files
- **File preview** - Code editor, PDF viewer, media playback
- **Diff viewer** - Compare local vs remote versions
- **Permission editor** - Visual chmod interface
- **Transfer queue** - Pause/resume/cancel with progress tracking

### Advanced Features
- **Smart Sync** - Bidirectional sync with conflict resolution
- **Process Manager** - View and manage remote processes
- **Port Forwarding** - Visual tunnel manager
- **Snippet Library** - Save and execute command templates
- **Log Tail Viewer** - Stream remote logs with filtering
- **Collaborative Mode** - Share sessions with team members (read-only/controlled)

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Terminal**: xterm.js 5.x with addons
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom terminal themes

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **SSH/SFTP**: ssh2 library
- **WebSocket**: ws with binary support
- **Session Store**: Redis
- **Authentication**: JWT + bcrypt

## Project Structure

```
web-ssh-client/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Terminal/   # xterm.js wrapper
│   │   │   │   ├── FileManager/
│   │   │   │   └── ConnectionManager/
│   │   │   ├── stores/         # Zustand state
│   │   │   └── hooks/
│   │   └── package.json
│   └── gateway/                # Node.js WebSocket/SSH bridge
│       ├── src/
│       │   ├── ssh/            # SSH2 wrappers
│       │   ├── websocket/      # WS handlers
│       │   └── transfer/       # File transfer logic
│       └── package.json
├── packages/
│   ├── shared-types/           # Shared TypeScript types
│   └── protocol/               # Binary protocol definitions
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js 20 or higher
- Docker and Docker Compose (optional, for containerized deployment)

### Development Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Start development servers**:
```bash
npm run dev
```

This starts both the frontend (port 3000) and gateway (port 4000).

3. **Build for production**:
```bash
npm run build
```

### Docker Deployment

```bash
docker-compose up -d
```

Access the application at `http://localhost:3000`

## Security Features

- **WSS Only**: All WebSocket connections require TLS
- **Encrypted Keys**: SSH keys encrypted with AES-256 at rest
- **No Password Storage**: Passwords never stored, only hashed with bcrypt
- **JWT Sessions**: Short-lived tokens with refresh mechanism
- **CSRF Protection**: Token validation on all state-changing operations
- **Rate Limiting**: Protection against brute force attacks
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.

## Configuration

### Environment Variables

**Gateway Server**:
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `REDIS_URL` - Redis connection string

**Frontend**:
- Configured via Vite environment variables

## API Documentation

### WebSocket Messages

#### Terminal Messages
- `terminal:data` - Send/receive terminal data
- `terminal:resize` - Update terminal dimensions
- `terminal:ping/pong` - Keep-alive

#### SFTP Messages
- `sftp:list` - List directory contents
- `sftp:download` - Download file from remote
- `sftp:upload` - Upload file to remote
- `sftp:delete` - Delete remote file/directory
- `sftp:rename` - Rename/move remote file
- `sftp:mkdir` - Create remote directory
- `sftp:chmod` - Change file permissions

#### Connection Messages
- `connect` - Establish SSH connection
- `connect_success` - Connection established
- `connect_error` - Connection failed
- `disconnect` - Close connection

## Roadmap

- [ ] AI command suggestions
- [ ] Git integration in file manager
- [ ] Database browser (MySQL/PostgreSQL)
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron/Tauri)
- [ ] Plugin system

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [xterm.js](https://xtermjs.org/) - Terminal component
- [ssh2](https://github.com/mscdex/ssh2) - SSH2 library for Node.js
- [Fastify](https://fastify.dev/) - Web framework
- [Radix UI](https://www.radix-ui.com/) - UI components
