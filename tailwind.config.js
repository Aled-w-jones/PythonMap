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
        'vsc-comment': '#6A9955',  // Example: for comments
        
        // Light mode colors
        'vsc-light-bg-dark': '#FFFFFF',
        'vsc-light-bg-medium': '#F3F3F3', // For sidebars, status bars
        'vsc-light-bg-light': '#E8E8E8',  // For selected items, active tabs
        'vsc-light-text-primary': '#1E1E1E',
        'vsc-light-text-secondary': '#6C6C6C', // For comments, disabled text
        'vsc-light-accent-blue': '#0078D4', // For interactive elements, links
        'vsc-light-border': '#C8C8C8', // For subtle borders
        'vsc-light-selection-bg': '#ADD6FF', // For selected text background
        // Light mode syntax highlighting colors
        'vsc-light-keyword': '#0000FF', // For 'def', 'import'
        'vsc-light-string': '#A31515',  // For "hello world"
        'vsc-light-comment': '#008000'  // For comments
      }
    },
  },
  plugins: [],
}

