# PythonMap - Code Exhibition & Notepad Viewer

A static website for showcasing Python scripts with interactive walkthroughs, syntax highlighting, and comprehensive documentation. Built with Astro for optimal performance on GitHub Pages.

## 🚀 Features

- **Interactive Code Walkthroughs**: Step-by-step guided tours through code with highlighting and annotations
- **VS Code Dark Theme**: Professional styling with authentic VS Code color scheme
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Static Site Generation**: Fast loading with no client-side routing delays
- **Search & Filter**: Find scripts and notepads quickly
- **Split View**: Code and documentation side-by-side
- **Syntax Highlighting**: Professional Python, JavaScript, JSON, and Markdown highlighting

## 🛠️ Built With

- **Astro** - Static Site Generator
- **Tailwind CSS** - Styling
- **Highlight.js** - Syntax highlighting
- **Marked** - Markdown processing
- **TypeScript** - Type safety

## 📁 Project Structure

```
├── src/
│   ├── components/          # Astro components
│   │   ├── CodeBrowser.astro
│   │   ├── NotepadViewer.astro
│   │   └── SearchBar.astro
│   ├── content/             # Content collections
│   │   └── notepads/        # Notepad metadata
│   ├── layouts/             # Page layouts
│   ├── pages/               # Routes
│   │   ├── browser/         # File browser pages
│   │   └── notepads/        # Notepad pages
│   └── utils/               # Utilities
├── public/                  # Static assets
├── scripts/                 # Python scripts to showcase
└── build-tools/             # Build utilities
```

## 🚀 Development

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PythonMap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:4321/PythonMap`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run build:search` - Generate search index

## 📝 Adding Content

### Adding a New Script

1. **Add your Python script** to the `scripts/` directory
2. **Create a notepad entry** in `src/content/notepads/`
3. **Add README file** (optional) for documentation
4. **Add annotations** (optional) for interactive walkthrough

### Notepad Configuration

Create a JSON file in `src/content/notepads/`:

```json
{
  "id": "my_script",
  "title": "My Python Script",
  "description": "Description of what this script does",
  "filePath": "scripts/my_script.py",
  "readmeFile": "scripts/my_script_README.md",
  "tags": ["python", "automation"],
  "author": "Your Name",
  "lastUpdated": "2025-01-27T00:00:00Z",
  "dependencies": ["requests", "json"]
}
```

## 🎨 Customization

### Themes

The project uses VS Code-inspired themes. Customize colors in `tailwind.config.js`:

```javascript
colors: {
  'vsc-bg-dark': '#1E1E1E',
  'vsc-text-primary': '#CCCCCC',
  // ... more VS Code colors
}
```

### Components

All components are in `src/components/` and built with Astro for maximum performance.

## 🚀 Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment:

1. **Push to main branch**
2. **GitHub Actions** automatically builds and deploys
3. **Static files** served from `dist/` directory

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your static hosting provider
```

## 📊 Performance

- **Static HTML**: No JavaScript needed for navigation
- **Fast Loading**: Optimized for GitHub Pages
- **SEO Friendly**: Pre-rendered content
- **Mobile Optimized**: Responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- VS Code team for the excellent color palette
- Astro team for the amazing static site generator
- Tailwind CSS for the utility-first approach