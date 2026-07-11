import type { DecisionEnvelope } from "@/shared/types";
import type { AuditChain, AuditSignature } from "./AuditChain";

export class DispatchApi {
  constructor(private readonly auditChain: AuditChain) {}

  async dispatch(decision: DecisionEnvelope, signature: AuditSignature | null, operatorId: string): Promise<{ accepted: boolean; reason: string }> {
    const approvalRequired = decision.actions.some((action) => action.requiresApproval);
    if (!approvalRequired) return { accepted: true, reason: "no_approval_required" };
    if (!signature) return { accepted: false, reason: "missing_ed25519_signature" };
    const verified = await this.auditChain.verify(decision, signature, operatorId);
    return verified
      ? { accepted: true, reason: "accepted_signed_payload" }
      : { accepted: false, reason: "invalid_or_expired_signature" };
  }
}
