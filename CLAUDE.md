# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server with HMR
npm run build    # Type-check with tsc, then build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Tech Stack

- React 19 with TypeScript
- Vite 7 for bundling and dev server
- ESLint with TypeScript and React plugins

## Project Structure

- `src/main.tsx` - Application entry point, renders App in StrictMode
- `src/App.tsx` - Root component
- `src/index.css` - Global styles
- `src/App.css` - App component styles

## TypeScript Configuration

- Strict mode enabled with additional checks (`noUnusedLocals`, `noUnusedParameters`)
- Target ES2022, uses `react-jsx` transform
- Source files in `src/` directory only
