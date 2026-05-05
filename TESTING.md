# Testing Guide

## Setup
1. Install dependencies: `npm install`
2. Install Playwright browsers: `npx playwright install`

## Running Tests
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- View E2E report: `npx playwright show-report`

## Test Structure
- `__tests__/` - Unit and integration tests (Jest)
- `tests/` - End-to-end tests (Playwright)

## Notes
- Serve the app locally (e.g., `python -m http.server 8000`) for E2E tests.
- Unit tests focus on JS logic; E2E tests cover full user workflows.