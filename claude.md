-----

# Project: Python Script Notepad & Codebase Browser

## 1\. Project Goal

To build a local-first Svelte web application that serves as:

A "notepad" viewer for various Python scripts, allowing for easy Browse and viewing of their content.
A codebase browser for the underlying Git repository, enabling navigation of files and folders.
A system to link "notepads" directly to specific Python scripts within the Git repository, ensuring consistency and ease of updates.
When a `README.md` file is present in a Python script's directory, it will be displayed prominently, along with a dynamic listing of other files and subdirectories adjacent to it.
**Enhanced Experience:** Provide richer metadata, annotations, search/filter capabilities, responsive design, and robust error handling for a polished presentation of Python code.
**Default Dark Mode (VS Code-like):** The website will launch with a dark theme by default, specifically designed to visually resemble the popular VS Code dark mode, providing a modern, comfortable, and familiar viewing experience.

-----

## 2\. Technology Stack

**Frontend:** SvelteKit (for framework, routing, Static Site Generation (SSG), and file system access during build)
**Styling:** Tailwind CSS (for utility-first styling and robust dark mode implementation with granular control over colors to mimic VS Code)
**Markdown Rendering:** `marked` (or similar, for `README.md` files)
**Syntax Highlighting:** `highlight.js` (configured with a VS Code-like dark theme)
**Version Control:** Git
**Deployment:** GitHub Pages via GitHub Actions

-----

## 3\. Repository Structure (Initial Proposal)

```
/
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       └── deploy.yml
├── src/                         # SvelteKit source code
│   ├── lib/                     # Svelte components, utilities
│   │   ├── components/
│   │   │   ├── NotepadViewer.svelte
│   │   │   ├── CodeBrowser.svelte
│   │   │   ├── ReadmeDisplay.svelte
│   │   │   ├── FileExplorer.svelte  # To list files/folders dynamically
│   │   │   └── SearchBar.svelte     # For enhanced search
│   │   ├── utils/
│   │   │   └── file-helpers.ts      # For path manipulation, file type checks
│   │   └── stores/                  # Svelte stores for global state (e.g., search query)
│   ├── routes/                  # SvelteKit pages/routes
│   │   ├── +layout.svelte       # Main layout, potentially contains header/nav
│   │   ├── +page.svelte         # Home page
│   │   ├── notepads/
│   │   │   ├── +page.svelte     # List all notepads
│   │   │   └── [slug]/          # Dynamic route for individual notepads
│   │   │       ├── +page.svelte
│   │   │       └── +page.server.ts # Server-side logic to read script content
│   │   └── browser/
│   │       └── [...path]/       # Catch-all dynamic route for codebase Browse
│   │           ├── +page.svelte
│   │           └── +page.server.ts # Server-side logic to read directory contents, READMEs
│   ├── app.html                 # SvelteKit's main HTML template
│   └── app.css                  # Global styles, includes Tailwind base/components/utilities
├── static/                      # Static assets (images, fonts, favicons, highlight.js themes)
├── scripts/                     # Directory for your Python scripts
│   ├── script_a.py
│   ├── project_x/
│   │   ├── README.md            # Example README in a script directory
│   │   ├── util.py
│   │   ├── data/
│   │   │   └── input.csv
│   │   └── annotations.json     # Optional: For line-by-line annotations
│   ├── script_b.py
│   └── another_project/
│       ├── README.md
│       └── main.py
├── data/                        # JSON or similar for notepad metadata
│   ├── notepads.json            # Centralized metadata for all notepads
│   └── search_index.json        # Pre-built search index (for SSG)
├── .gitignore
├── svelte.config.js
├── package.json
├── tsconfig.json                # If using TypeScript (recommended for SvelteKit)
├── tailwind.config.cjs          # Tailwind CSS configuration
├── postcss.config.cjs           # PostCSS configuration for Tailwind
├── README.md                    # Project README
├── LICENSE
└── claude.md                    # This very file!
```

-----

## 4\. `/.gitignore` Management

This will be a living document, updated as we add new tools and dependencies.

### Initial `.gitignore` (Root)

```gitignore
# SvelteKit specific
.svelte-kit/
build/
.env
.env.*
VITE_
!VITE_
npm-debug.*
*.log
node_modules/
dist/

# Git
.git/
.gitattributes
.gitignore

# OS specific
.DS_Store
Thumbs.db

# Python specific (if you have a local dev server or virtual environment)
__pycache__/
*.pyc
*.pyo
*.pyd
.venv/
env/
venv/

# Search index (can be rebuilt)
data/search_index.json # If you're building this dynamically at build time
```

### Potential `.gitignore` Additions (As Project Evolves)

**IDE/Editor specific:**
    `.vscode/` (if you share configs, otherwise `settings.json`, `launch.json` etc. can be ignored)
    `.idea/` (for IntelliJ/WebStorm)
**Testing frameworks:**
    `coverage/` (if using a testing tool that generates coverage reports)
**Temporary files:**
    `*.tmp`
    `*~`
    `*.swp`
**Dependency caches:**
    `pnpm-lock.yaml` (if using pnpm and want to manage it differently)
    `yarn.lock` (if using yarn)

-----

## 5\. Core Functionality & Features

### 5.1. Notepad Viewer

**Browse Notepads:** A main page listing all available "notepads" (Python scripts).

**View Script Content:** When a notepad is selected, display the raw content of the linked Python script with syntax highlighting. The **syntax highlighting theme will be chosen to closely match VS Code's default dark theme.**

**Link Management:** A `data/notepads.json` file will map a human-readable "notepad" name/ID to its corresponding file path within the `scripts/` directory, including richer metadata.

    *Example `data/notepads.json` (with richer metadata):*

    ```json
    [
      {
        "id": "my_first_script",
        "title": "My First Python Automation",
        "description": "A simple script to automate file operations on your system.",
        "filePath": "scripts/script_a.py",
        "tags": ["automation", "files", "beginner"],
        "author": "Your Name",
        "lastUpdated": "2025-07-23T10:00:00Z",
        "dependencies": ["os", "shutil"],
        "annotationsFile": "scripts/script_a_annotations.json" // Optional: for annotations
      },
      {
        "id": "data_analysis_utils",
        "title": "Data Analysis Utilities for Pandas",
        "description": "Helper functions for data manipulation and cleaning using Pandas.",
        "filePath": "scripts/project_x/util.py",
        "tags": ["data science", "pandas", "intermediate"],
        "author": "Your Name",
        "lastUpdated": "2025-07-20T14:30:00Z",
        "dependencies": ["pandas", "numpy"],
        "annotationsFile": "scripts/project_x/util_annotations.json"
      }
    ]
    ```

**Explanatory Annotations/Walkthroughs (New):**

    Allow for pop-up tooltips, side-panel comments, or inline explanations for specific lines or blocks of code.
    This data could be stored in a separate JSON file adjacent to the script (e.g., `script_a_annotations.json`), containing line numbers/ranges and their corresponding explanations.

    *Example `scripts/script_a_annotations.json`:*

    ```json
    [
      {
        "lines": "1-3",
        "title": "Module Imports",
        "text": "Importing necessary modules: 'os' for operating system interaction and 'shutil' for high-level file operations."
      },
      {
        "lines": "10",
        "title": "Define Base Path",
        "text": "Setting the base directory. It's good practice to use `os.path.join` for cross-platform compatibility."
      },
      {
        "lines": "25-30",
        "title": "Error Handling for Directory Creation",
        "text": "Using a try-except block to gracefully handle cases where the directory already exists, preventing a FileExistsError."
      }
    ]
    ```

**Collapsible Sections (New):**

    Implement UI elements to allow users to collapse/expand large functions or logical blocks of code within the `NotepadViewer` to improve readability. This might involve parsing the Python script structure or relying on code comments for hints.

### 5.2. Codebase Browser

**Directory Listing:** Navigate through the `scripts/` directory (and potentially other relevant code directories) to view files and subdirectories.
**File Content Display:** Clicking on a file in the browser will display its content (similar to the notepad viewer, with syntax highlighting).
**Breadcrumbs:** A navigation trail showing the current directory path. The **visual style of breadcrumbs and directory listings will mimic VS Code's sidebar/explorer.**
**README Integration:**
    When navigating to a directory (e.g., `/browser/scripts/project_x`), the application will check for the presence of a `README.md` file within that directory.
    If found, the `README.md` content will be rendered (using a Markdown parser) at the top of the page.
    Below the `README.md`, the page will dynamically list all other files and subfolders within that same directory, providing links to navigate further or view file content.

### 5.3. User Experience & Navigation (New Features)

**Enhanced Search & Filtering:**
    **Full-Text Search:** Implement a search bar that searches titles, descriptions, and the *content* of Python scripts and `README.md` files. This will be facilitated by a pre-built search index.
    **Filter by Tags/Categories:** Use the snippet metadata to create clickable tags that filter the list of notepads.
    **Sort Options:** Allow users to sort snippets by name, last updated, difficulty, etc.
**Responsive Design:** Ensure the entire Svelte app (including all components, layout, and code displays) looks and functions impeccably on desktops, tablets, and mobile phones.
**Code Sharing & Copying:**
    **"Copy to Clipboard" Button:** A prominent button next to each code snippet to easily copy its content.
    **Direct Link to Line Numbers:** Functionality to generate a URL that links directly to a specific line number within a script (e.g., `yourwebsite.com/notepads/my_script#L15`).
**Error Handling & Loading States:**
    **"File Not Found" Pages:** Gracefully handle cases where a user tries to access a non-existent notepad or file path with a custom, themed error page.
    **Loading Spinners:** Display subtle loading indicators for any content that might take a moment to appear (e.g., initial page load, or large file loads if not fully pre-rendered).

-----

## 6\. Development Workflow (Local First)

1.  **Initialize Git Repository:**
    ```bash
    git init
    ```
2.  **Create Initial `.gitignore`:** (As outlined above)
3.  **Create SvelteKit Project:**
    ```bash
    npm create svelte@latest my-website
    cd my-website
    npm install
    ```
    *Self-correction:* Ensure `my-website` is the root of the repo, or adjust the directory structure. For this plan, assume `my-website` **is** the root of the repo.
4.  **Install Dependencies:**
    `npm install @sveltejs/kit`
    `npm install -D tailwindcss postcss autoprefixer`
    `npx tailwindcss init -p` (to generate `tailwind.config.cjs` and `postcss.config.cjs`)
    `npm install highlight.js`
    `npm install marked`
    `npm install -D @types/node` (for `fs` module in `+page.server.ts` if using TypeScript)
    Consider installing a specific `highlight.js` theme if one directly matches VS Code.
5.  **Configure Tailwind CSS for VS Code-like Dark Mode (in `tailwind.config.cjs`):**
    Set `darkMode: 'class'`.
    **Crucially, extend the `theme.colors` to include custom colors that mimic VS Code's dark theme palette** (e.g., `#1E1E1E` for background, `#252526` for sidebar/panels, `#CCCCCC` for default text, specific shades for primary/secondary actions). This will allow you to use these colors consistently.
    <!-- end list -->
    ```javascript
    /** @type {import('tailwindcss').Config} */
    export default {
      content: ['./src/**/*.{html,js,svelte,ts}'],
      darkMode: 'class', // Enable class-based dark mode
      theme: {
        extend: {
          colors: {
            // VS Code Dark+ theme inspired palette
            'vsc-bg-dark': '#1E1E1E',
            'vsc-bg-medium': '#252526', // For sidebars, status bars
            'vsc-bg-light': '#333333',  // For selected items, active tabs
            'vsc-text-primary': '#CCCCCC',
            'vsc-text-secondary': '#808080', // For comments, disabled text
            'vsc-accent-blue': '#007ACC', // For interactive elements, links
            'vsc-border-light': '#444444', // For subtle borders
            'vsc-selection-bg': '#264F78', // For selected text background
            // Add specific syntax highlighting colors if needed, e.g. for keywords, strings, etc.
            'vsc-keyword': '#569CD6', // Example: for 'def', 'import'
            'vsc-string': '#CE9178',  // Example: for "hello world"
            'vsc-comment': '#6A9955'  // Example: for comments
          }
        },
      },
      plugins: [],
    };
    ```
6.  **Update `src/app.html` for Default Dark Mode:**
    Apply the `dark` class to the `<html>` tag by default. This class will trigger Tailwind's dark mode styles.
    ```html
    <!doctype html>
    <html lang="en" class="dark"> <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%sveltekit.assets%/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        %sveltekit.head%
      </head>
      <body data-sveltekit-preload-data="hover">
        <div style="display: contents">%sveltekit.body%</div>
      </body>
    </html>
    ```
7.  **Update `src/app.css` to include Tailwind base styles and VS Code-like defaults:**
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    /* Global VS Code-like Dark Mode Defaults */
    body {
      @apply bg-vsc-bg-dark text-vsc-text-primary;
      /* Adjust scrollbar colors for a darker theme (browser specific) */
      scrollbar-color: #555 #333;
      scrollbar-width: thin;
    }

    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-track {
      background: #333;
    }

    ::-webkit-scrollbar-thumb {
      background-color: #555;
      border-radius: 5px;
      border: 2px solid #333;
    }

    /* Highlight.js theme import */
    /* Choose a highlight.js theme that matches VS Code's aesthetic (e.g., 'monokai-sublime', 'atom-one-dark').
       You might need to download the CSS for your chosen theme and place it in `static/`
       or install it via npm and import it. */
    @import url('path/to/highlightjs/styles/monokai-sublime.css'); /* Or another suitable theme */

    /* Override highlight.js base colors if necessary to fine-tune to VS Code */
    pre code {
      @apply bg-transparent !important; /* Let parent background dictate */
      color: var(--vsc-text-primary); /* Use Tailwind defined color */
    }

    /* Specific highlight.js token overrides if needed for closer match */
    .hljs-keyword {
      color: theme('colors.vsc-keyword');
    }
    .hljs-string {
      color: theme('colors.vsc-string');
    }
    .hljs-comment {
      color: theme('colors.vsc-comment');
    }
    /* ... more overrides for other token types */
    ```
8.  **Develop Svelte Components:**
    `NotepadViewer.svelte`: Component to display code. Ensure all its internal elements (code block background, line numbers, text, annotation pop-ups) are styled using the Tailwind `dark:` prefix or the custom `vsc-` colors to match the VS Code aesthetic.
    `CodeBrowser.svelte`: Parent component for the browser view. Its layout (sidebar, main content) should mirror VS Code's file explorer.
    `ReadmeDisplay.svelte`: Component to render Markdown. Ensure its headings, text, links, and code blocks (within Markdown) also follow the dark theme.
    `FileExplorer.svelte`: Component to display interactive file/folder lists. Styles for folder icons, file names, active/hover states should be carefully chosen to evoke VS Code's file tree.
    `SearchBar.svelte`: Component for the search input. Style the input field, placeholder text, and results display consistent with the dark theme.
9.  **Implement SvelteKit Routes with Server-Side Loading (`+page.server.ts`):**
    Dynamic routes for notepads (`/notepads/[slug]`)
        `src/routes/notepads/[slug]/+page.server.ts`: Responsible for reading the Python script content and its associated annotation file based on `params.slug` and `notepads.json`.
    Dynamic routes for codebase browser (`/browser/[...path]`)
        `src/routes/browser/[...path]/+page.server.ts`: Responsible for:
            Determining if the `path` refers to a file or directory.
            If directory: checking for `README.md`, reading its content, and listing all files/subdirectories within that path using Node.js `fs` module.
            If file: reading the file's content.
10. **Data Handling:**
    `data/notepads.json`: Central metadata for all notepads.
    `data/search_index.json`: A pre-computed JSON file containing indexed text content from all scripts and READMEs for efficient client-side search. This will be generated during the build process.
11. **Run Locally:**
    ```bash
    npm run dev
    ```

-----

## 7\. Deployment Strategy (GitHub Pages & GitHub Actions)

**Static Site Generation (SSG) Focus:** SvelteKit's adapter-static will be used to generate a fully static site that can be served directly by GitHub Pages. All file reads (Python scripts, READMEs, annotations) will happen at build time, ensuring fast performance.
**GitHub Repository:** Create a new public repository on GitHub.
**Push Code:** Push your local repository to GitHub.
**GitHub Actions Workflow (`.github/workflows/deploy.yml`):**
    Trigger on push to `main` branch.
    Install dependencies.
    **Generate Search Index:** A custom script or part of the build process will generate `data/search_index.json` by traversing `scripts/` and extracting text content.
    Build SvelteKit application (`npm run build`). This will use the static adapter to pre-render all pages.
    Deploy the `build` directory to GitHub Pages.

### Example `deploy.yml` (Simplified for SSG)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18' # Or your preferred Node.js version

      - name: Install dependencies
        run: npm install

      # Optional: Step to generate search index if not integrated directly into build
      # - name: Generate Search Index
      #   run: node scripts/generate-search-index.js # Create this script yourself

      - name: Build SvelteKit app (Static)
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build # SvelteKit's default output for adapter-static
          # cname: your-custom-domain.com # Uncomment if you use a custom domain
```

-----

## 8\. Development Milestones

**Phase 1: Basic Setup & Core Notepads (with Default VS Code Dark Mode)**
    Initialize Git repo with initial `.gitignore`.
    Set up SvelteKit project with `adapter-static`.
    Install and **configure Tailwind CSS for `darkMode: 'class'` and add VS Code-like custom colors.**
    **Modify `src/app.html` to include `class="dark"` on the `<html>` tag.**
    **Update `src/app.css` for base VS Code dark mode backgrounds, text colors, and scrollbar styling. Import or configure a `highlight.js` theme that closely matches VS Code.**
    Create `scripts/` and `data/` directories.
    Implement basic home page and `/notepads` list.
    Create `data/notepads.json` with initial rich metadata.
    Implement `/notepads/[slug]` dynamic route with `+page.server.ts` to read Python script content.
    Develop `NotepadViewer.svelte` with syntax highlighting, ensuring all internal styling uses Tailwind's `dark:` prefix or custom `vsc-` colors to precisely match the VS Code aesthetic (e.g., code block backgrounds, text colors, line numbers).
**Phase 2: Codebase Browser with READMEs (VS Code Styling)**
    Implement `/browser/[...path]` dynamic route with `+page.server.ts` to:
        Read directory contents (files and subdirectories).
        Check for and read `README.md` files.
    Develop `CodeBrowser.svelte` and `ReadmeDisplay.svelte`, ensuring their styling (layout, panels, borders) aligns with the VS Code dark theme.
    Develop `FileExplorer.svelte` to dynamically list and link files/folders, with icons, text colors, and hover/selection states styled to strongly evoke VS Code's file tree.
**Phase 3: Content Enhancement**
    Implement **Explanatory Annotations/Walkthroughs**:
        Update `+page.server.ts` to read annotation JSON files.
        Modify `NotepadViewer.svelte` to display annotations interactively (e.g., on hover, or a toggle), ensuring the annotation UI elements are also styled for the VS Code dark theme.
    Implement **Collapsible Sections** in `NotepadViewer.svelte`, styled for the VS Code dark theme.
**Phase 4: User Experience (Search, Filters, Responsiveness)**
    Implement **Enhanced Search & Filtering**:
        Create a script to generate `data/search_index.json` during the build process.
        Develop `SearchBar.svelte` and integrate client-side search logic. Ensure the search bar, input field, and results dropdown/list are styled for the VS Code dark theme.
        Add filtering by tags/categories on the `/notepads` listing page, styled to fit the overall theme.
    Implement **"Copy to Clipboard" button** for code snippets, with a clear, themed visual feedback.
    Implement **Direct Link to Line Numbers** functionality, ensuring visual indication of linked lines matches the theme.
    Ensure **Responsive Design** for all components and layouts, maintaining the VS Code dark mode aesthetic across different screen sizes.
**Phase 5: Robustness & Deployment Preparation**
    Implement **Error Handling & Loading States**:
        Create custom error pages (`src/routes/[[...path]]/+error.svelte`), styled using the VS Code dark theme.
        Add loading indicators where appropriate, styled to blend with the dark theme.
    Cleanly build the project for static deployment.
    Thoroughly test local build using `npm run build` and `npm run preview`.
    Set up GitHub repository.
    Create and refine GitHub Actions workflow for deployment.
**Phase 6: Live Deployment**
    Push to GitHub and verify deployment on GitHub Pages.

-----

## 9\. Future Enhancements (Beyond this Scope)

**Interactive Shell/Execution:** While deferred, consider technologies like Skulpt/Brython for browser-based Python execution or a serverless function backend for full execution.
**Visualizations & Demos:** For scripts generating plots, integrate a way to display these directly (e.g., embedding HTML outputs or pre-rendered images).
**Git Integration:** Display git blame, commit history for scripts.
**Light Mode Toggle:** While dark mode is default, you might eventually want to provide a user-facing toggle to switch to a light theme. This would involve managing a state and toggling the `dark` class on the `<html>` element.
**Testing:** Implement unit and integration tests for Svelte components.