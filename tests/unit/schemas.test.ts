import { describe, expect, it } from "vitest";
import { ActionCommandSchema } from "@/shared/schemas";

describe("Zod schemas", () => {
  it("rejects malformed tool-call text", () => {
    const result = ActionCommandSchema.safeParse({
      id: "bad-action",
      priority: "high",
      title: "<script>alert(1)</script>",
      dispatch: "Send staff",
      channel: "radio",
      requiresApproval: true,
      physicalBackup: false
    });
    expect(result.success).toBe(false);
  });
});
