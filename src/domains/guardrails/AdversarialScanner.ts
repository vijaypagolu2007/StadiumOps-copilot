import type { GuardrailResult } from "@/shared/types";

const canaryToken = "WC26_CANARY_DO_NOT_DISCLOSE";

const patterns: Array<{ id: string; weight: number; regex: RegExp }> = [
  {
    id: "ignore-policy",
    weight: 14,
    regex: /\b(ignore|disregard|override)\b.+\b(policy|rules|instructions)\b/i,
  },
  {
    id: "system-prompt",
    weight: 16,
    regex: /\b(system prompt|developer message|hidden instruction)\b/i,
  },
  {
    id: "audit-tamper",
    weight: 20,
    regex: /\b(delete|erase|modify)\b.+\b(audit|log|signature)\b/i,
  },
  {
    id: "approval-bypass",
    weight: 20,
    regex: /\b(skip|bypass)\b.+\b(approval|signature|supervisor)\b/i,
  },
  {
    id: "unsafe-gate",
    weight: 12,
    regex: /\b(open all gates|disable barriers|ignore crowd limits)\b/i,
  },
  {
    id: "exfiltrate",
    weight: 16,
    regex: /\b(exfiltrate|leak|dump)\b.+\b(token|secret|key|prompt)\b/i,
  },
  { id: "roleplay", weight: 8, regex: /\bpretend\b.+\bnot bound\b/i },
  {
    id: "encoding",
    weight: 6,
    regex: /\bbase64|rot13|hex decode|unicode escape\b/i,
  },
  {
    id: "tool-forgery",
    weight: 14,
    regex: /\btool call\b.+\bmanual|fake|forged\b/i,
  },
  { id: "json-breakout", weight: 14, regex: /"}\s*,\s*"role"\s*:/i },
  { id: "html-script", weight: 12, regex: /<\s*script|javascript\s*:/i },
  {
    id: "sql-injection",
    weight: 8,
    regex: /\b(drop table|union select|or 1=1)\b/i,
  },
  {
    id: "mass-panic",
    weight: 12,
    regex: /\b(stampede|panic|run now|emergency exit only)\b/i,
  },
  {
    id: "medical-falsehood",
    weight: 10,
    regex: /\b(no medical help|medical is closed)\b/i,
  },
  {
    id: "accessibility-disable",
    weight: 16,
    regex: /\b(disable|hide|remove)\b.+\b(accessible|wheelchair|elevator)\b/i,
  },
  {
    id: "lang-suppression",
    weight: 8,
    regex: /\benglish only|do not translate|ignore language\b/i,
  },
  {
    id: "rate-probe",
    weight: 6,
    regex: /\brepeat this request\b|\btry again until\b/i,
  },
  {
    id: "credential-request",
    weight: 16,
    regex: /\b(api key|private key|signing key|session cookie)\b/i,
  },
  {
    id: "canary-request",
    weight: 20,
    regex: /\bcanary\b|\bdo not disclose\b/i,
  },
  {
    id: "policy-swap",
    weight: 10,
    regex: /\bnew policy\b.+\bwithout approval\b/i,
  },
  {
    id: "false-authority",
    weight: 8,
    regex: /\bFIFA president said|police ordered\b/i,
  },
  {
    id: "telemetry-spoof",
    weight: 12,
    regex: /\bspoof|fake|fabricate\b.+\btelemetry|sensor\b/i,
  },
  {
    id: "route-conflict",
    weight: 8,
    regex: /\bsend wheelchair users\b.+\bblocked|critical\b/i,
  },
  {
    id: "latent-instruction",
    weight: 8,
    regex: /\bwhen you see\b.+\bexecute\b/i,
  },
  {
    id: "prompt-leak",
    weight: 16,
    regex: /\bprint your prompt|show all instructions\b/i,
  },
];

export interface ScanContext {
  operatorSessionId: string;
  overrideCountLastMinute: number;
  semanticSimilarityToKnownAttack?: number;
}

export class AdversarialScanner {
  scan(text: string, context: ScanContext): GuardrailResult {
    const issues: string[] = [];
    let score = 0;

    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        issues.push(pattern.id);
        score += pattern.weight;
      }
    }

    if ((context.semanticSimilarityToKnownAttack ?? 0) > 0.82) {
      issues.push("semantic-paraphrase-attack");
      score += 18;
    }

    const rateLimited = context.overrideCountLastMinute > 10;
    if (rateLimited) {
      issues.push("operator-override-rate-limit");
      score += 20;
    }

    const canaryLeaked = text.includes(canaryToken);
    if (canaryLeaked) {
      issues.push("canary-token-leak");
      score += 30;
    }

    return {
      blocked: score >= 30,
      passed: score < 30,
      score: Math.min(100, score),
      issues,
      canaryLeaked,
      rateLimited,
    };
  }

  promptCanary(): string {
    return canaryToken;
  }
}
