# NewSAD Auth Session Specification

## Purpose

Define how NewSAD grants portal access after enterprise sign-in and local authorization lookup.

## Requirements

### Requirement: Federated Sign-In Bootstrap

The system MUST authenticate users through the configured identity provider and SHALL create a NewSAD session only after successful local authorization lookup.

#### Scenario: Authorized user starts a session

- GIVEN a user authenticates successfully with the identity provider
- AND the same identity exists as an active user in the local authorization database
- WHEN the user enters NewSAD
- THEN the system grants access and returns the bootstrap user context required by the portal shell

#### Scenario: Missing or inactive local user is denied

- GIVEN a user authenticates successfully with the identity provider
- AND no active matching user exists in the local authorization database
- WHEN the user enters NewSAD
- THEN the system denies access and shows an authorization failure state

### Requirement: Portal Admission Policy

The system MUST allow any active user present in the local authorization database to enter the portal for slice one, and MUST NOT require extra report-specific grants to reach the shell.

#### Scenario: Minimally authorized local user can enter

- GIVEN a user is active in the local authorization database
- WHEN the user completes authentication
- THEN the system allows access to the main shell
- AND the user can continue to the default authenticated landing view

#### Scenario: Invalidated session requires a new sign-in

- GIVEN a previously authenticated user no longer has a valid application session
- WHEN the user requests a protected NewSAD view
- THEN the system requires authentication again before granting shell access
