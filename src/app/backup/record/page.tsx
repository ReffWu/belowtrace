import type { Metadata } from "next";
import { StepShell } from "@/components/flow/step-shell";
import { RecordForm } from "@/components/flow/record-form";

export const metadata: Metadata = { title: "Save your number" };

export default function RecordStep() {
  return (
    <StepShell step={2} of={3} back="/backup" title="Protect your claim." lead="You'll need both to file a damage claim with DWSD. They stay on this device.">
      <RecordForm />
    </StepShell>
  );
}
