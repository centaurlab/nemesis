# Nemesis

## Independent verification for agent-written software

> Coding agents shouldn't grade their own homework.

AI coding agents are rapidly becoming capable of taking a requirement, writing the implementation, writing tests, and declaring the task complete.

But there is a fundamental problem:

**The same agent that creates the solution often creates the evidence that the solution is correct.**

Nemesis adds an independent verification layer.

Instead of asking:

> "Do the tests pass?"

Nemesis asks:

> "Would these tests detect a plausible wrong implementation?"

---

# The Problem

A typical AI coding workflow looks like:

```
Developer requirement
        |
        v
   Coding agent
        |
        v
Implementation + tests
        |
        v
"18/18 tests passing"
        |
        v
Ready to merge
```

The problem is that passing tests do not necessarily prove that the agent understood the requirement.

An agent can:

1. misunderstand a requirement;
2. implement the wrong behavior;
3. write tests around that misunderstanding;
4. pass every test.

The result:

```
Tests pass.
Confidence is false.
```

---

# The Nemesis Approach

Nemesis introduces an independent adversary.

The workflow:

```
Developer intent
        |
        v
  Coding agent
        |
        v
 Code + tests
        |
        v
      Nemesis
        |
        +----------------+
        |                |
        v                v
Create plausible     Run existing
wrong implementation tests
        |                |
        +-------+--------+
                |
                v
       Did the tests catch it?
                |
        +-------+-------+
        |               |
        v               v
    Defended        Proof gap
```

Nemesis does not simply review code.

It creates executable challenges.

---

# Example

Requirement:

> Invitations expire exactly 7 days after issuance.

The coding agent implements the feature.

Tests pass:

```
✓ 18 / 18 tests passing
```

Nemesis creates a plausible wrong implementation:

```
Expired invitations remain valid.
```

Then it verifies:

## Correct implementation

```
Accept invitation after 8 days

Result:
INVITE_EXPIRED
```

## Adversarial implementation

```
Accept invitation after 8 days

Result:
INVITE_ACCEPTED
```

Now Nemesis asks:

> Would the existing tests notice?

If the answer is no:

```
✓ BUILD
✓ TESTS
✕ PROOF

2 requirements are still unproven
```

The issue is not necessarily that the code is wrong.

The issue is that the evidence is insufficient.

---

# Strengthening the Proof

Nemesis identifies the missing proof:

```
Your tests never exercise:

"accept an invitation after day 7"
```

The coding agent adds the missing test.

Before:

```
Wrong implementation

        |
        v

Tests pass
```

After:

```
Wrong implementation

        |
        v

New test fails
```

The requirement becomes defended.

```
✓ BUILD
✓ TESTS
✓ PROOF

4 / 4 requirements defended

VERIFIED
```

---

# Core Concepts

## Requirements, not coverage

Traditional testing asks:

> How much code did we execute?

Nemesis asks:

> Which behaviors did we actually prove?

The primary unit is a requirement.

Example:

```
R1  Only admins can invite users       DEFENDED

R2  Invitations expire after 7 days    NOT DEFENDED

R3  Resend invalidates old token       NOT DEFENDED

R4  Resend resets expiration window    DEFENDED
```

---

## Counterfactuals

A counterfactual is a plausible implementation that violates exactly one requirement.

A valid counterfactual must:

- compile;
- boot;
- preserve unrelated behavior;
- demonstrate an observable behavioral difference;
- survive or fail against the existing tests.

Nemesis does not trust a model's opinion.

The adversary proposes.

Execution decides.

---

## Executable Witnesses

A concern is not enough.

Nemesis requires a witness.

Example:

Concern:

> "Maybe expired invitations still work."

Witness:

```
Create invitation at T0.

Attempt acceptance at T0 + 8 days.

Expected:
INVITE_EXPIRED

Observed:
INVITE_ACCEPTED
```

The difference must be observed by execution.

---

# Demo Flow

The Nemesis demo shows three moments.

## 1. Agent confidence

The coding agent reports:

```
Implementation complete.

✓ Build passed
✓ 18 / 18 tests passing
```

Everything looks ready.

---

## 2. Independent verification

Nemesis challenges the proof:

```
✓ BUILD
✓ TESTS
✕ PROOF

18 / 18 tests pass.

2 requirements are still unproven.
```

The evidence drawer shows exactly what the tests failed to prove.

---

## 3. Verified confidence

After strengthening:

```
✓ BUILD
✓ TESTS
✓ PROOF

4 / 4 requirements defended

VERIFIED
```

---

# Architecture

```
                 Developer Intent

                       |
                       v

                Coding Agent

                       |
                       v

             Implementation + Tests

                       |
                       v

                  Nemesis

          +-------------------------+
          | Requirement extraction  |
          | Counterfactuals         |
          | Witness validation      |
          | Isolated execution      |
          | Test evaluation         |
          +-------------------------+

                       |
                       v

          Requirement Defense Report
```

---

# Design Principles

## 1. The generator should not be the judge

The agent that writes the solution should not be the only source of confidence.

---

## 2. Opinions are weaker than execution

A reviewer saying:

> "This might be wrong."

is weaker than:

> "Here is a working wrong implementation, and your tests failed to detect it."

---

## 3. Proof should be inspectable

Every verification result should have:

- requirement;
- adversarial implementation;
- witness;
- execution result;
- test outcome.

---

# Current Demo

The current demo uses a deterministic team invitation application.

Requirements:

1. Only admins can send invitations.
2. Invitations expire exactly 7 days after issuance.
3. Resending invalidates the previous token.
4. Replacement invitations receive a new 7-day expiration window.

Initial state:

```
R1 DEFENDED
R2 NOT_DEFENDED
R3 NOT_DEFENDED
R4 DEFENDED

2 / 4 requirements defended
```

After strengthening:

```
R1 DEFENDED
R2 DEFENDED
R3 DEFENDED
R4 DEFENDED

4 / 4 requirements defended
```

---

# Why Now?

Software development is moving from:

```
Human writes code
Human writes tests
Human reviews
```

toward:

```
AI writes code
AI writes tests
AI proposes completion
```

The bottleneck shifts.

Code generation becomes cheaper.

Trust becomes harder.

Nemesis is designed to become the verification layer between AI-generated software and production.

---

# Future Direction

Potential future integrations:

- AI coding agents;
- pull request checks;
- CI/CD pipelines;
- GitHub workflows;
- enterprise software review.

The long-term vision:

```
AI Agent

    |

Nemesis Verification Layer

    |

Production Software
```

---

# Summary

Nemesis does not ask:

> "Did the agent write code?"

It asks:

> "Did the agent produce enough evidence that we should trust the code?"

Because in the future of AI-generated software:

**Writing code is only half the problem. Proving it is correct is the other half.**
