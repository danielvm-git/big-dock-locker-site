# Ubiquitous Language — Big DockLocker Marketing Website

This document defines the canonical domain model and ubiquitous language for the Big DockLocker website.

## Core Concepts

### 1. DockLocker

The application being marketed: a native macOS utility that locks and prevents alterations to the user's macOS Dock.

### 2. Release State Machine (`releaseMachine`)

A deterministic, pure reducer managing async state transitions for the GitHub Releases API consumer:

- `idle`: initial state before fetch is triggered
- `loading`: network fetch in-flight with abort timeout attached
- `ready`: release payload loaded and cached with optimistic download count tracking
- `failed`: network or HTTP error state with retry mechanism
- `refreshing`: background revalidation on document visibility change preserving existing data

### 3. Clipboard Machine

The state lifecycle for terminal install snippet copying:

- `idle`: initial state showing copy icon
- `copying`: clipboard API call in-flight
- `copied`: successful write with ephemeral confirmation feedback
- `copy-error`: permission or clipboard failure with fallback error state

### 4. Asset Targets

The compiled DMG payloads:

- `arm64`: Apple Silicon DMG
- `x64`: Intel DMG

### 5. Preflight Gate

The non-negotiable verification sequence: `npm run preflight` combining typecheck, unit tests, code formatting checks, and bundle generation.
