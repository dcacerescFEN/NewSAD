# Design: Full NewSAD Migration to SADAlumnos Architecture

## Technical Approach

Rebuild NewSAD as a SADAlumnos-shaped solution: layered .NET backend (`Domain` → `Application` → `Infrastructure` → `WebApi`) plus Angular `WebUI`. The first slice replaces the Astro shell with an authenticated Angular shell, keeps all current external header links, and renders the existing Power BI views only after Keycloak authentication and local DB authorization succeed.

## Architecture Decisions

### Decision: Full replacement over hybrid runtime

| Option | Tradeoff | Decision |
|---|---|---|
| Keep Astro during migration | Lower initial change, duplicated auth/runtime | Rejected |
| Replace with .NET + Angular shell | Bigger cutover, single target architecture | Chosen |

Rationale: proposal/specs require no Astro dependency after cutover and alignment with SADAlumnos patterns.

### Decision: Reuse SADAlumnos auth/session pattern

| Option | Tradeoff | Decision |
|---|---|---|
| Frontend-only Keycloak state | Simpler SPA flow, weak local authorization coupling | Rejected |
| OIDC on WebApi + cookie session + revalidation | More backend work, matches reference repo | Chosen |

Rationale: local DB admission is authoritative, and SADAlumnos already solves claim shaping, cookie session, and periodic authorization revalidation.

### Decision: Treat Power BI and links as configuration-backed portal content

| Option | Tradeoff | Decision |
|---|---|---|
| Hardcode report/link metadata in Angular | Fast port, costly future edits | Rejected |
| Serve portal config from backend | Extra endpoint/model, clean boundary | Chosen |

Rationale: preserves slice-one parity while isolating environment-specific URLs and embed IDs from UI code.

## Data Flow

```text
Browser ──→ Angular auth guard ──→ GET /api/auth/user-info
   │                                  │
   │ unauthenticated                  └─→ Cookie auth / OIDC challenge
   └──────────────────────────────────────────────→ Keycloak

Keycloak callback ──→ WebApi ──→ SessionPrincipalFactory ──→ SADAdministracion DB
                                              │
                                              └─→ cookie claims snapshot

Angular shell ──→ GET /api/portal/bootstrap ──→ app config + header links + report catalog
Angular report page ──→ iframe render using approved Power BI URLs
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `NewSAD.slnx` | Create | Solution root matching SADAlumnos project layout |
| `src/Domain/**` | Create | NewSAD entities, shared constants, auth/report contracts |
| `src/Application/**` | Create | Login/bootstrap/report queries and request handlers |
| `src/Infrastructure/**` | Create | EF Core contexts, config loaders, SADAdministracion integration |
| `src/Web/WebApi/Program.cs` | Create | Minimal API startup, auth, antiforgery, SPA fallback |
| `src/Web/WebApi/ConfigureServices.cs` | Create | OIDC, cookie auth, DI registration |
| `src/Web/WebApi/Endpoints/Auth/AuthEndpoints.cs` | Create | Login, logout, user-info endpoints |
| `src/Web/WebApi/Endpoints/Portal/PortalEndpoints.cs` | Create | Bootstrap config and report metadata endpoint |
| `src/Web/WebApi/Services/SessionPrincipalFactory.cs` | Create | Local authorization snapshot → claims principal |
| `src/Web/WebUI/**` | Create | Angular standalone app with guarded shell and report feature |
| `src/Web/WebUI/src/app/core/layout/**` | Create | Header/footer/layout preserving branding and links |
| `src/Web/WebUI/src/app/features/auth/**` | Create | Session store, login redirect, logout flow |
| `src/Web/WebUI/src/app/features/portal/**` | Create | Shell landing and external link navigation |
| `src/Web/WebUI/src/app/features/reports/**` | Create | Power BI tab/report rendering with unavailable state |
| `src/pages/**`, `src/components/**`, `src/layouts/**`, `src/styles/**` | Delete after cutover | Retire Astro shell once parity is verified |

## Interfaces / Contracts

```ts
export interface PortalBootstrap {
  user: { userName: string; displayName: string; roles: string[]; permissions: string[] };
  navigationLinks: { label: string; icon: string; url: string }[];
  reports: { key: string; label: string; embedUrl: string }[];
  theme: { defaultMode: 'light' | 'dark' | 'auto'; storageKey: string };
}
```

```csharp
public sealed record PortalBootstrapDto(
    SessionUserDto User,
    IReadOnlyList<NavigationLinkDto> NavigationLinks,
    IReadOnlyList<ReportItemDto> Reports,
    ThemeConfigDto Theme);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Session bootstrap, return-url validation, report/bootstrap mapping | .NET unit tests for handlers/services |
| Integration | OIDC callback to local authorization, protected endpoints, bootstrap payload | WebApi integration tests with mocked auth/DB seams |
| E2E | Unauthenticated redirect, authorized shell entry, report unavailable state | Angular/Playwright smoke flow once toolchain exists |

## Migration / Rollout

1. Scaffold solution/projects in parallel with existing Astro app.
2. Implement backend auth/session/bootstrap endpoints against SADAdministracion model.
3. Build Angular shell/auth/report features using backend bootstrap config.
4. Verify parity: login, all header links, Power BI visibility, failure states.
5. Cut over runtime to .NET + Angular; remove Astro files in a final slice.

Rollback: keep Astro branch/deployment untouched until parity checks pass; if cutover fails, redeploy previous Astro artifact and postpone file deletion.

## Open Questions

- [ ] Confirm where NewSAD report/link metadata will live initially (`appsettings`, config table, or dedicated portal table).
