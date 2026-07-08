# Implementation Plan

This is a large, multi-part request. I'll deliver it in **6 focused workstreams**. Before I start, I need a couple of quick decisions from you.

---

## Open questions (please confirm)

1. **Backend**: Enable **Lovable Cloud** (managed Postgres + Auth + Storage)? Required for real auth, upload persistence, and cross-refresh state. *Recommended: Yes.*
2. **Auth methods**: Email/Password + Google sign-in (defaults), or email/password only?
3. **User profiles**: Store profile fields (name, department, role, avatar)? *Recommended: Yes — matches the industrial persona already in the mock data.*
4. **AI pipeline**: Real Lovable AI (Gemini) for entity/summary extraction, or **realistic simulation** (staged timers + rich mock data, no API cost)? *Recommended: simulation for the hackathon demo — instant, deterministic, and visually rich; wire real AI later.*

---

## Workstream 1 — Real Authentication
- Enable Lovable Cloud, configure email/password (+ Google if approved).
- `profiles` table + trigger; `user_roles` table + `has_role()` RPC (admin/engineer/viewer).
- Move `/app/*` under `src/routes/_authenticated/` with the managed gate.
- Rebuild `/login`, `/signup`, `/forgot-password`, add `/reset-password`.
- Root `onAuthStateChange` → `router.invalidate()`; sign-out hygiene.
- Header shows user avatar + sign-out driven by session.

## Workstream 2 — Upload Storage & Persistence
- Storage bucket `documents` (private) + signed-URL downloads.
- Tables: `documents`, `document_stages`, `document_entities` with RLS scoped to `auth.uid()`.
- Upload flow: client → Storage → insert `documents` row → server function advances 9 pipeline stages, persisting each.
- On refresh, Upload Center + Library rehydrate from DB (no lost state).

## Workstream 3 — AI Document Intelligence Pipeline (Upload Center rebuild)
Azure-Document-Intelligence-style UI:
- **Left**: uploads list with status filter chips (Queued / Processing / Ready / Failed), progress bars, stage badge.
- **Center**: document preview panel (PDF/image thumbnail, or type-based placeholder) + AI Summary, Confidence Score meter, keywords, related assets, regulatory refs.
- **Right (expandable)**: Extracted Entities grouped — Equipment IDs, Valve/Pump/Boiler IDs, Maintenance Dates, Engineers, Safety Procedures, Compliance Standards.
- 9-stage animated pipeline (File Uploaded → OCR → Text → Entities → Metadata → Embeddings → Graph Link → AI Index → Ready) with per-stage spinners, timings, and check states.
- Realistic industrial mock generators seeded per document (equipment tags like `P-101`, standards like `ISO 55001`, engineers, etc.).

## Workstream 4 — Report Exports (PDF + CSV)
- Reports page: each report card gets **Export PDF** and **Export CSV** buttons.
- CSV: generated client-side from report data (Blob download).
- PDF: `jspdf` + `jspdf-autotable`, branded header/footer, tables and KPI summary.
- Toast on completion; filenames include report name + ISO date.

## Workstream 5 — Accessibility Pass
- Skip-to-content link; single `<main>` per route.
- `aria-label` on every icon-only button (sidebar toggle, notifications, theme, close, etc.).
- Visible `focus-visible` ring using design tokens; ensure 44×44 tap targets on mobile.
- Labels/`aria-describedby` on all form inputs; error messages associated.
- Keyboard: sidebar, command palette, dialogs, dropdowns all reachable via Tab/Esc/Arrow.
- Replace any low-contrast `text-muted-foreground/50` with tokens meeting AA.

## Workstream 6 — Playwright E2E
Under `tests/e2e/`:
- `auth.spec.ts` — signup → login → protected redirect → logout.
- `dashboard.spec.ts` — sidebar nav across all modules, charts render.
- `upload.spec.ts` — drag/drop mock file, pipeline advances to Ready, entities panel populates.
- `library.spec.ts` — filter by department/tag, grid↔list toggle, open preview.
- Uses the sandbox-injected Supabase session pattern; headless Chromium.

---

## Technical notes
- Stack: TanStack Start server functions for pipeline advancement, Supabase RLS for isolation, `jspdf` + `papaparse` for exports, `@axe-core/playwright` optional for a11y assertions in tests.
- No new external services beyond Lovable Cloud + Lovable AI (if you pick real AI in Q4).
- Estimated 15–25 new/modified files.

**Reply with answers to Q1–Q4 (or "all recommended") and I'll build it.**
