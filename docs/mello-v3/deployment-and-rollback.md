# Deployment, staging and rollback evidence

Evidence date: 15 November 2026. Roles 02/13. Inspected baseline `2c1f9e887f49e85a726c70214afc2e296d66530a`.

## Environment separation

- Existing live project: `appgprj_6af73c0b8dc08191ad62ad4b4711684d`, URL `https://daliy-premium.zany-sugar-0629.chatgpt.site/`. The source manifest binds D1/R2. This specialist did not call deploy, mutate environment variables or inspect customer records.
- Local staging: `npm run build` then `npm run dev`; `scripts/serve.mjs` serves on 127.0.0.1:3187 and invokes the generated Worker with local SQLite `.openai/local/support-preview.sqlite` and filesystem `.openai/local/uploads`.
- Local QA identity routes `/__preview/login?role=owner|customer|guest` exist **only in the local Node server**, not the deployed Worker. Incoming `oai-*` headers are stripped by the local server before explicit preview identities are supplied.
- Local SQLite automatically applies tracked Drizzle migrations. It is not a clone or backup of live D1. Local uploads and synthetic orders are not production records.
- Production runtime/secret values are not in tracked source. Deployment should preserve existing environment and audience. No payment flag, account, shipping policy, domain or price change is approved by this brief.

## Baseline and backups

Git has baseline source and generated Worker tracked at the revision above. `git status --short` was empty at inspection start. A Git revision is a recoverable source baseline, **not a backup of D1, R2, environment secrets or provider state**.

The orchestrator owns creation and validation of source archives and local restore rehearsal. This specialist has not exported or restored production D1/R2, so production business-data backup verification is **BLOCKED — NO ACCESS** in this pass. Do not label local SQLite copies as production backups. Before any schema/data change, obtain supported live database and object backup capabilities and verify restore to a separate environment; never restore over live customer records for testing.

## Safe release sequence

1. Freeze and record the intended source revision, diff, build output and evidence index.
2. Run `npm ci`, `npm test`, `npm run build` in an isolated checkout with the pinned lockfile. Build output must match reviewed source; capture logs and checksums.
3. Run local staging browser/SEO/accessibility and integration checks; verify all synthetic data stays local. Review protected logo/illustrations at matching viewports.
4. Require independent QA/security review and the V3 owner production approval. A staged pass is not a deployed pass. Unresolved P0 commerce/data risks block commerce launch even if a smaller engineering patch is safe.
5. Preserve hosting manifest ID and D1/R2 bindings. Package exactly the reviewed commit with the Sites source helper; do not use the optional static Netlify build for this Worker deployment.
6. Deploy the saved reviewed version only after required approval; capture deployment ID, source SHA and actual terminal state. Do not widen private audience or change domain as part of a routine code release.
7. Smoke-test live routes, assets, read-only checkout readiness and protected endpoints. Do not place real-money orders or write fake production orders.

## Rollback procedure and limitations

For a code-only release with no schema changes, retain the last known-good Sites saved version, source SHA and deployment identity. Rollback means republishing that saved version through the supported Sites deployment action after authorised incident decision; it should not restore local files over production data. Recheck live source/behaviour and access policy afterward.

No rollback was executed in production by this pass. Saved-version existence and service rollback must be verified by the orchestrator using Sites history, not inferred from Git alone. Rebuilding an old commit checks source reproducibility only; it cannot prove database restore or provider reversal. Payments already accepted and orders written are not undone by code rollback.

No migration is proposed for the bounded route/search/accessibility work. For future schema migrations, document backward compatibility, backup, staging restore and roll-forward recovery before production execution.

## Known reliability gaps

- No external uptime monitor or payment/order reconciliation job was found.
- Worker APIs catch many subsystem errors, but no common request correlation/central incident pipeline was found.
- No deployment workflow in GitHub CI; checks do not automatically deploy.
- Dependency checks/builds are useful but not proof of customer journeys or field availability.
- Local tests all pass (32/32 baseline); real payment settlement, email delivery, carrier tracking and production restoration remain unverified.

Review request: role 12 independently validate staging separation, source archive restore, build reproducibility and production approval gates. Role 08 review secret handling and release permissions. No independent professional security, legal or payment certification is claimed.
