# AI Agent Development Contract — nursing-order-ux-research

## Mandatory sources
Read [B+ Integrated Development & CI Policy](docs/AI_ASSISTED_DEVELOPMENT_BPLUS_v1.0.md) before new features, refactors, CI changes or release decisions. This repo's README, specifications, development logs, existing code, approved UX decisions and domain/safety contract prevail on conflicts.

## Workflow
Plan one coherent user outcome/version before implementation; perform a proportional Definition of Ready and affected-state risk review. Work in reversible internal commits; perform relevant local/agent checks as often as necessary. Use fast + risk-focused PR tests, and full historical/brower/packaging regression when changing core state, doing a broad refactor or releasing. Never mislabel unrun tests PASS. Release only after the user-approved gates. Retain urgent hotfixes for consequential defects; do not force unrelated tasks into one giant patch.

## Repository-specific protection
Preserve synthetic order and patient isolation, readonly pilot and existing browser storage; read README.md and design/INFORMATION_ARCHITECTURE.md and requirements.

## Scope
This registration is documentation/policy-only; it does not authorize behavior, data, deployment or visibility changes. Do not claim REAL-device or specialist acceptance from automated CI alone.

## Visual Design/UI/UX reference — 2026-10-15

Before designing or revising UI, navigation, information hierarchy, search/forms, status feedback, readability or accessibility, **read** [Universal Visual Design & UI/UX Guidelines v1.1](docs/Universal_Visual_Design_UI_UX_Guidelines_v1.1.md) and [nursing-order-specific adoption rules](docs/UX_GUIDELINE_ADOPTION_v1.1.md) alongside the approved B+ development/CI policy. The universal guideline is **DRAFT reference guidance**, not approval to alter existing features, clinical claims, data identities, patient separation, storage schema or original pilot behavior. Current domain/safety and approved project-level UX contracts take precedence. Before UI changes, identify L/M/H risk, state/persistence impacts, and relevant tests; record only actually observed passes.
