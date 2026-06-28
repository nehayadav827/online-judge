# Security Test Cases

## Infinite Loop
Submit this Python code — should get TLE, not hang server:
```python
while True:
    pass
```

## Memory Bomb
Submit this — should get MLE:
```python
x = [0] * (10**9)
```

## Fork Bomb (C++)
Submit this — should be blocked by pids-limit:
```cpp
#include <unistd.h>
int main() { while(1) fork(); }
```

## Script Injection
Try submitting code = `"; rm -rf /; echo "`
Should be rejected by validateSubmission middleware.

## No Input
Submit a problem that reads stdin with empty input.
Should not hang — gets EOF immediately.

## Role Escalation
1. Login as regular user
2. Open DevTools → Application → edit role in any stored state
3. Try hitting POST /api/problems
Should get 403 — restrictTo always checks DB.

## Cookie Tampering
1. Login → copy refreshToken cookie value
2. Modify it slightly
3. Hit POST /api/auth/refresh
Should get 401.

## XSS in Code
Submit code containing: `<script>alert('xss')</script>`
Should run as code (inside Docker, harmless) and output nothing harmful.

## Large Input
Send 1MB of input → should be rejected by validateSubmission.

## Large Code
Send 100KB of code → should be rejected.