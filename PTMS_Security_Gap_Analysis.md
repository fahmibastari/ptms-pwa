# PTMS Security & Architectural Audit Report
**Project Name:** Personal Trainer Management System (PTMS)  
**Security Standard:** OWASP Top 10 / PWA Best Practices  
**Status:** Audit Completed · Version 3.0-Audit  

---

## 1. Executive Summary

This audit report evaluates the technical architecture and database models of the **PTMS Next.js PWA** application. The objective is to identify security vulnerabilities, potential database bottlenecks, and session integrity flaws before coding begins. 

Our deep dive identified **12 architectural gaps**, categorized below. The primary risks centered on **client-side authorization vectors** and **database connection limits in serverless runtimes**.

---

## 2. Risk & Vulnerability Registry

| ID | Vulnerability / Gap | Domain | Severity | Status | Mitigation Strategy |
|:---:|---|---|:---:|:---:|---|
| **G01** | Client-side role spoofing via `X-Active-Role` | Authorization | 🔴 CRITICAL | `✅ FIXED` | Restrict context to server-side session checks only. |
| **G02** | Database connection pool starvation | Infrastructure | 🔴 CRITICAL | `✅ FIXED` | Enforce pgBouncer/pooled database URL connection. |
| **G03** | Immutable JWT session role desync | Authentication | 🔴 CRITICAL | `⏳ PENDING` | Server-cached active role store / immediate reissue. |
| **G04** | Low-entropy QR code tokens (UUID v4) | Cryptography | 🟠 HIGH | `⏳ PENDING` | Upgrade to CSPRNG 256-bit hexadecimal string. |
| **G05** | Lack of global session revocation mechanism | Session Mgmt | 🟠 HIGH | `⏳ PENDING` | Implement administrative JWT/refresh token revocation. |
| **G06** | Database time drift (UTC vs WIB borders) | Consistency | 🟠 HIGH | `✅ FIXED` | Standardize UTC in database; offset queries to WIB. |
| **G07** | Missing security headers (CORS/CSP/Frame) | Network Sec | 🟠 HIGH | `⏳ PENDING` | Inject CSP, XSS protection, and frame headers. |
| **G08** | RSC vs TanStack Query stack redundancy | Tech Stack | 🟡 MEDIUM | `⏳ PENDING` | Standardize Server Actions; limit SWR to live QR. |
| **G09** | QrToken / AuditLog table bloat | Database | 🟡 MEDIUM | `⏳ PENDING` | Deploy automated pg_cron database pruning. |
| **G10** | Redundant relation keys in `SessionNote` | DB Schema | 🟡 MEDIUM | `✅ FIXED` | Remove duplicate relation keys; resolve via Attendance. |
| **G11** | Ambiguous re-assignment workflow | Logic | 🟢 LOW | `⏳ PENDING` | Standardize soft-delete cascade patterns. |
| **G12** | Undefined testing & system monitoring | DevOps | 🟢 LOW | `⏳ PENDING` | Integrate Vitest, Playwright, and Sentry. |

---

## 3. Deep-Dive Analysis & Technical Mitigations

### 🔴 G01. Authorization Bypass via Client Headers
> [!CAUTION]
> **Risk Description:** Allowing the client browser to declare the authorization role using headers (e.g., `X-Active-Role`) allows malicious actors to execute privilege escalation attacks simply by spoofing headers.

#### 🛠️ Secured Implementation Pattern (Next.js Middleware Guard)
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Resolve session securely from HTTP-only cookie
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  // Retrieve user metadata securely stored on the server side
  const activeRole = session.user.user_metadata.active_role
  const path = req.nextUrl.pathname

  // Enforce access controls
  if (path.startsWith('/admin') && activeRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/403', req.url))
  }
  
  if (path.startsWith('/trainer') && activeRole !== 'TRAINER') {
    return NextResponse.redirect(new URL('/403', req.url))
  }

  return res
}
```

---

### 🔴 G02. Database Connection Starvation in Serverless Functions
> [!WARNING]
> Next.js Serverless routes on Vercel spin up dynamic instances. If every request opens a direct database connection, the database pool (limit 60 on Supabase basic tiers) will exhaust under minimal load, resulting in application-wide timeouts.

#### 🛠️ Secured Connection String Patterns
```env
# ❌ Direct Connection (Prohibited)
DATABASE_URL="postgresql://postgres:pass@db.project.supabase.co:5432/postgres"

# ✅ Connection Pooled URL (Mandatory for pgBouncer Transaction Pool)
DATABASE_URL="postgresql://postgres:pass@db.project.supabase.co:6543/postgres?pgbouncer=true&connection_limit=5"

# ✅ Direct connection URL for Prisma migrations (runs locally/CI-CD)
DIRECT_URL="postgresql://postgres:pass@db.project.supabase.co:5432/postgres"
```

---

### 🟠 G04. QR Code Security (CSPRNG vs UUID v4)
> [!IMPORTANT]
> UUID v4 generators do not guarantee cryptographic randomness. Predictable tokens allow users to pre-calculate check-in parameters and bypass physical presence checks.

#### 🛠️ Crypto Token Generator
```typescript
import { randomBytes } from 'crypto';

/**
 * Generates a highly secure CSPRNG check-in token.
 * 32 bytes of random data formatted as a 64-character hex string.
 */
export function generateSecureCheckinToken(): string {
  return randomBytes(32).toString('hex');
}
```

---

### 🟠 G06. UTC Date Borders vs WIB Queries
> [!NOTE]
> Database servers execute in UTC timezone. Storing timestamps in UTC is correct, but daily business reports and check-in constraints must be computed in WIB (UTC+7) to prevent date translation issues.

#### 🛠️ Safe WIB Query Pattern
```typescript
import { startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export async function getTodayAttendances(memberId: string) {
  const timeZone = 'Asia/Jakarta';
  
  // Calculate local WIB day boundaries
  const localNow = utcToZonedTime(new Date(), timeZone);
  const startLocal = startOfDay(localNow);
  const endLocal = endOfDay(localNow);
  
  // Convert local boundaries back to UTC for database querying
  const startUtc = zonedTimeToUtc(startLocal, timeZone);
  const endUtc = zonedTimeToUtc(endLocal, timeZone);

  return await prisma.attendance.findMany({
    where: {
      memberId,
      checkedInAt: {
        gte: startUtc,
        lte: endUtc,
      },
    },
  });
}
```

---

## 4. Pre-Implementation Security Checklist

### Phase 1: Pre-Code Core Setup
- [ ] Verify Supabase Auth webhook correctly syncs `auth.users` to Prisma `User` schema.
- [ ] Connect pgBouncer transaction pooler and configure Prisma schema multi-connection options.
- [ ] Enforce global middleware validating sessions directly from HTTP-only session cookies.

### Phase 2: QR Token Lifecycle
- [ ] Verify scan validation operations execute inside atomic database transactions (`$transaction` with `SELECT FOR UPDATE`).
- [ ] Restrict token lifetime strictly to 30 seconds.
- [ ] Configure database clean-up cron job for table purging.

### Phase 3: Hardening
- [ ] Configure secure HTTP headers via `next.config.js`.
- [ ] Restrict cross-origin access strictly to deployment domains.
- [ ] Define rate-limiting rules for API endpoints.
