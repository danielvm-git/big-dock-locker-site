# 1. Selection of Vue 3, TypeScript, and Vite

Date: 2026-11-06

## Status

Accepted

## Context

The Big DockLocker project requires a fast, lightweight, and maintainable marketing website. The site needs reactive components to display live release information, handle clipboard copying, and provide responsive navigation.

## Decision

We chose Vue 3 (Composition API with `<script setup>`), TypeScript, and Vite.

- Vue 3 `<script setup>` provides optimal DX, reactivity, and minimal bundle overhead.
- TypeScript guarantees strict type safety across components and state machine models.
- Vite offers lightning-fast builds and native ESM dev server performance.

## Consequences

- Single-page application bundle remains ultra-compact (< 350 kB uncompressed, ~117 kB gzipped).
- Easy component unit testing via Vitest and Vue Test Utils without heavy test harnesses.
