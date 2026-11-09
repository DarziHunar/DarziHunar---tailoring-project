# DarziHunar – Complete Dependency Vulnerability Remediation Report

**Document type:** Security Audit & Remediation Report  
**Project:** DarziHunar  
**Scope:** NestJS Backend and Expo Mobile Application  
**Objective:** Reduce reported npm dependency vulnerabilities to zero without introducing unnecessary breaking changes.

---

# 1. Executive Summary

During dependency security remediation, DarziHunar initially reported approximately **35–36 vulnerabilities** across its dependency ecosystem.

The findings originated primarily from indirect dependencies introduced by development tools, testing frameworks, build utilities and other packages.

The remediation process involved:

1. Auditing the complete dependency tree.
2. Identifying vulnerable transitive dependencies.
3. Applying safe, non-breaking dependency updates.
4. Removing an unnecessary NestJS deployment helper.
5. Replacing Jest and ts-jest with Vitest.
6. Removing obsolete Jest dependencies.
7. Reviewing Expo SDK 58 dependency findings separately.
8. Running npm audits and application build checks.

The backend dependency audit subsequently reported:

```text
found 0 vulnerabilities
```

The production-only backend audit also reported zero vulnerabilities.

The mobile application passed all 20 Expo Doctor checks, although its five moderate npm audit findings remained unresolved at the time of this report.

---

# 2. Initial Security Audit – 35–36 Vulnerabilities

The original backend dependency audit identified approximately 35–36 vulnerabilities.

The findings included:

- Low-severity vulnerabilities.
- Moderate-severity vulnerabilities.
- High-severity vulnerabilities.
- Vulnerable transitive dependencies.

The reported dependency issues included packages such as:

| Package | Associated issue |
|---|---|
| glob | Filesystem traversal after AbortSignal cancellation |
| minimatch | Potential denial of service through globparts amplification |
| deepmerge | Prototype pollution |
| tmp | Vulnerability in temporary-file handling |
| undici | Dependency security advisory |
| Other transitive packages | Additional npm audit findings |

The original findings were not necessarily vulnerabilities in DarziHunar's own application code. Many originated from third-party packages installed indirectly through development and testing dependencies.

## Why did this happen?

Node.js applications use dependency trees.

A package installed directly in a project may depend on several other packages. Those packages may introduce additional dependencies.

For example:

```text
DarziHunar Backend
│
├── NestJS
│   ├── NestJS CLI
│   ├── NestJS Schematics
│   └── Other tooling
│
├── Jest
│   └── @jest/core
│       ├── jest-config
│       ├── jest-runtime
│       ├── glob
│       └── deepmerge
│
├── ts-jest
│   └── @jest/transform
│       └── babel-plugin-istanbul
│           └── test-exclude
│               ├── glob
│               └── minimatch
│
└── Other application dependencies
```

Even when a developer does not directly install a vulnerable package, npm can report it because another installed package depends on it.

---

# 3. Phase One – Initial Dependency Investigation

The first step was to inspect the dependency tree rather than immediately applying force upgrades.

Commands used:

```bash
npm audit
npm audit --omit=dev
npm ls --depth=0
```

These commands provided three different views:

| Command | Purpose |
|---|---|
| `npm audit` | Audits the complete dependency tree |
| `npm audit --omit=dev` | Audits dependencies excluding development packages |
| `npm ls --depth=0` | Lists directly installed dependencies |

The investigation showed that several vulnerabilities were introduced through development tooling rather than the application's production dependency set.

This distinction was important because production and development dependencies have different execution contexts and exposure.

---

# 4. Phase Two – Safe Dependency Updates

The first remediation attempt involved using npm's non-forced update mechanism.

```bash
npm audit fix
```

The dry-run investigation also identified possible safe package updates.

Examples included:

| Package | Previous version | Proposed version |
|---|---:|---:|
| @nestjs/cli | 12.0.11 | 12.0.12 |
| @nestjs/schematics | 12.0.0 | 12.0.13 |
| glob | 13.0.6 | 13.0.7 |
| picomatch | 4.0.5 | 4.0.7 |
| magic-string | 1.0.0 | 1.4.1 |
| ansis | 4.4.0 | 4.5.0 |

These were examples from the earlier dependency-update preview, not a complete final inventory.

However, safe updates alone did not eliminate all vulnerabilities.

The audit still identified vulnerable packages in the Jest dependency tree and the NestJS deployment tooling chain.

---

# 5. Phase Three – Removing @nestjs/mau

The investigation identified the following dependency chain:

```text
@nestjs/mau
    └── Inquirer
         └── external-editor
              ├── tmp
              └── undici
```

These dependencies contributed to the security findings in the original backend audit.

Since the project did not require the Mau deployment helper for its normal NestJS application build and runtime, it was removed.

Command:

```bash
npm uninstall @nestjs/mau
```

This eliminated an unnecessary dependency chain.

**Security lesson:** Avoid keeping optional development and deployment utilities installed when they are not needed by the project.

---

# 6. Phase Four – Investigating Jest Vulnerabilities

After the safe updates and removal of the optional deployment helper, the backend still reported:

```text
20 vulnerabilities (4 low, 16 moderate)
```

The remaining findings were primarily associated with Jest and its transitive dependencies.

The audit identified three important packages.

## 6.1 Deepmerge – Prototype Pollution

**Advisory:** GHSA-gcqx-w48m-w2h4  
**Severity:** Moderate

The vulnerability involved prototype pollution through the `mergeObject()` functionality.

Dependency chain:

```text
Jest
 └── @jest/core
      └── jest-config
           └── deepmerge
```

The installed version was:

```text
deepmerge@4.3.1
```

The audit recommended a forced Jest downgrade to version 25.1.0.

That was rejected because downgrading from Jest 30 to Jest 25 could introduce breaking changes.

## 6.2 Glob – AbortSignal Cancellation Bypass

**Advisory:** GHSA-3g3m-2fjr-6pw4  
**Severity:** Moderate

Glob is used to match filesystem paths and locate files.

The advisory concerned filesystem traversal continuing after cancellation or timeout.

Dependency chain:

```text
Jest
 └── @jest/core
      └── @jest/reporters
           └── glob
```

Another dependency chain involved:

```text
ts-jest
 └── @jest/transform
      └── babel-plugin-istanbul
           └── test-exclude
                └── glob
```

The installed vulnerable versions included Glob 13.x and 10.x.

## 6.3 Minimatch – Denial of Service

**Advisory:** GHSA-g3hv-75wg-m249  
**Severity:** Moderate

Minimatch is used to match file paths against glob patterns.

The vulnerability involved potential denial of service through globparts amplification.

It was introduced indirectly through Glob and related testing utilities.

---

# 7. Phase Five – Replacing Jest with Vitest

The original audit proposed:

```bash
npm audit fix --force
```

However, the proposed fix included downgrading Jest to 25.1.0.

Instead of introducing a major downgrade, the decision was made to replace the testing framework.

## Step 1 – Install Vitest and SWC

```bash
npm install --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
```

These packages provide the replacement testing infrastructure.

## Step 2 – Remove Jest dependencies

```bash
npm uninstall --save-dev jest ts-jest @types/jest
```

This removed:

- Jest
- ts-jest
- @types/jest
- Jest's associated dependency tree

The removal operation produced the following result:

```text
removed 236 packages, and audited 553 packages

found 0 vulnerabilities
```

This was the key step that eliminated the remaining reported backend dependency vulnerabilities.

## Step 3 – Update package scripts

The test scripts were updated to use Vitest:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage"
  }
}
```

## Step 4 – Verify the dependency tree

```bash
npm ls jest ts-jest deepmerge glob minimatch
```

The resulting dependency tree showed:

```text
tailoring
└── @nestjs/cli
    └── minimatch@11.0.5
```

The vulnerable Jest dependency chain was no longer present.

The remaining NestJS CLI Minimatch version was outside the affected version range reported by the advisory.

---

# 8. Phase Six – TypeScript Configuration Cleanup

After removing Jest, the backend build initially failed:

```text
error TS2688: Cannot find type definition file for 'jest'.

The file is in the program because:
Entry point of type library 'jest' specified in compilerOptions
```

This happened because the TypeScript configuration still referenced Jest even though its type definitions had been removed.

The required correction was to remove the obsolete Jest reference from the relevant TypeScript configuration.

For example, replace:

```json
{
  "compilerOptions": {
    "types": ["jest"]
  }
}
```

With:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

Any other required existing type definitions should be preserved.

**Verification status:** The TypeScript configuration correction was identified, but the successful build after that correction must be confirmed separately.

Existing tests must also be migrated and executed using Vitest before considering the test-runner migration complete.

---

# 9. Backend Final Security Results

The backend reached the following reported audit state after Jest and its associated dependencies were removed.

| Audit | Result |
|---|---|
| Initial backend audit | Approximately 35–36 vulnerabilities |
| Intermediate audit | 20 vulnerabilities |
| Final full backend audit | 0 vulnerabilities |
| Production-only backend audit | 0 vulnerabilities |

Final audit command:

```bash
npm audit
```

Recorded output:

```text
found 0 vulnerabilities
```

Production audit command:

```bash
npm audit --omit=dev
```

Recorded output:

```text
found 0 vulnerabilities
```

The zero-vulnerability result was observed after removing Jest and its dependencies.

---

# 10. Mobile Application – Separate Security Findings

The mobile application was audited separately because it uses Expo SDK 58.

The audit identified five moderate vulnerabilities involving Glob and Minimatch.

Dependency chain:

```text
Expo SDK 58
│
├── @expo/cli
│    └── glob
│
└── @expo/fingerprint
     ├── glob
     └── minimatch
```

The currently installed Expo tooling used dependency ranges that prevented a straightforward compatible upgrade to the patched major versions.

Running:

```bash
npm audit fix --force
```

proposed installing Expo 53.0.11, which would have been a major downgrade.

That approach was rejected.

The following checks passed:

```bash
npx expo-doctor
```

Result:

```text
20/20 checks passed. No issues detected!
```

And:

```bash
npx expo install --check
```

Result:

```text
Dependencies are up to date
```

**Important:** These results confirm Expo project compatibility checks passed, but they do not establish that the five mobile npm audit findings were resolved. The mobile findings remain a separate upstream dependency issue requiring a compatible Expo tooling release.

---

# 11. Preventive Security Measures

The following measures should be followed to prevent similar dependency problems.

## 11.1 Regular dependency audits

Run:

```bash
npm audit
npm audit --omit=dev
```

Perform audits:

- Before merging pull requests.
- Before production deployment.
- After installing new dependencies.
- During regular maintenance.

## 11.2 Avoid force upgrades

Do not blindly run:

```bash
npm audit fix --force
```

Instead:

```bash
npm audit
npm audit fix
```

Review the proposed changes and verify compatibility.

## 11.3 Keep package-lock.json committed

Always commit:

```text
package.json
package-lock.json
```

Use:

```bash
npm ci
```

for reproducible dependency installations.

## 11.4 Review new packages

Before installing a package:

```bash
npm view PACKAGE_NAME version
npm view PACKAGE_NAME dependencies
npm view PACKAGE_NAME engines
```

Check whether it is maintained and whether it introduces unnecessary dependencies.

## 11.5 Separate development and production dependencies

Install application runtime packages as production dependencies.

Install testing frameworks, build utilities and development tools using:

```bash
npm install --save-dev PACKAGE_NAME
```

This keeps the production dependency set smaller.

## 11.6 Use automated CI/CD security checks

Add an npm audit step to GitHub Actions.

Example:

```yaml
name: Dependency Security Audit

on:
  push:
    branches:
      - main
      - uat
  pull_request:
    branches:
      - main
      - uat

jobs:
  security-audit:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 26
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit

      - name: Build application
        run: npm run build
```

The workflow should be tested in the project's actual CI environment. Pin and regularly review GitHub Actions versions.

## 11.7 Review installation scripts

npm packages may execute scripts during installation.

Review them using:

```bash
npm install-scripts ls
```

Approve only trusted packages whose installation scripts are required.

## 11.8 Test after dependency changes

After updating dependencies:

```bash
npm run build
npm test
npm audit
```

Also run integration tests and important API endpoint checks.

---

# 12. Final Lessons Learned

The DarziHunar dependency remediation demonstrated several important security practices:

1. Vulnerabilities can originate from indirect dependencies, not only packages installed directly.
2. Development tools can contribute significantly to the total npm audit findings.
3. A clean production-only audit does not automatically mean the entire dependency tree is secure.
4. `npm audit fix --force` can introduce breaking changes and should not be used blindly.
5. Removing unnecessary dependencies can reduce the attack surface.
6. Replacing an outdated or unsuitable testing dependency chain can resolve multiple findings together.
7. Expo and backend dependencies should be audited independently.
8. A zero-vulnerability audit should be accompanied by build and test verification.

---

# 13. Final Project Security Checklist

- [x] Initial dependency audit performed.
- [x] Vulnerable dependency chains investigated.
- [x] Safe dependency updates applied.
- [x] Unnecessary `@nestjs/mau` dependency removed.
- [x] Jest and ts-jest removed.
- [x] Vitest installed as the replacement test runner.
- [x] Backend npm audit reports zero vulnerabilities.
- [x] Backend production-only audit reports zero vulnerabilities.
- [x] Expo Doctor reports 20/20 checks passed.
- [ ] Confirm backend build passes after TypeScript configuration cleanup.
- [ ] Complete migration and execution of existing tests under Vitest.
- [ ] Resolve remaining Expo mobile npm audit findings through a compatible upstream release.
- [ ] Integrate automated dependency audits into CI/CD.

---

**Conclusion**

DarziHunar's backend dependency security remediation reduced the reported vulnerability count from approximately 35–36 to zero.

The primary strategy was not to force incompatible package upgrades, but to investigate dependency relationships, remove unnecessary tooling, apply compatible updates and replace the vulnerable Jest dependency chain with Vitest.

The mobile application was assessed separately and retained on its supported Expo SDK version rather than being downgraded to satisfy npm audit.

This report serves as the project's historical record of the remediation process and a reference for future dependency security maintenance.