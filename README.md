# Mastra versionless workspace reproduction

This scratch workspace shows that `mastra dev` 1.33.0 with `@mastra/deployer` 1.75.0 fails when a TypeScript workspace dependency has no `version` in its package manifest.

Install and run from this directory:

```sh
pnpm install
node run-case.mjs versionless
node run-case.mjs versioned
```

The workspace uses pnpm's standard `publicHoistPattern` to reproduce the hoisted workspace layout that exposes the bug. The runner starts each CLI process in a separate process group, polls `/api/agents`, and terminates the group after success or 20 seconds.

Expected: both commands start the dev server and return HTTP 200 from `/api/agents`.

Observed on macOS 26.4, Node 24.15.0, pnpm 10.20.0:

```text
versionless: exit:0
ERROR (Mastra CLI): Missing "./@repro/versionless" specifier in "@repro/app" package
versioned: ready:200
```

The only difference is the dependency manifest's `version` field. The versionless error is logged during bundling, before the server starts. CLI exit status 0 does not indicate successful startup in that case.

Use free local ports 4191 and 4192. No provider credentials, database, or browser are needed. The runner writes `versionless.log` and `versioned.log`; the versioned run leaves its `0.0.0` version in the test manifest, and the next versionless run removes it.
