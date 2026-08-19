import { defaultProvider } from "../../lib/study/provider";
import type { ProcessInput, ProcessResult, ProcessingStatus, StudyMaterial } from "../../lib/study/types";
import type { SummaryMode } from "../../lib/study/types";

export interface ProcessOutput {
  status: ProcessingStatus;
  material?: StudyMaterial;
  error?: string;
}

export async function processStudyInput(
  input: ProcessInput,
  onProgress: (status: ProcessingStatus) => void,
  summaryMode: SummaryMode = "standard"
): Promise<ProcessOutput> {
  let lastKnownMaterial: StudyMaterial | undefined;

  const result: ProcessResult = await defaultProvider.process(input, {
    summaryMode,
    callbacks: {
      onProgress,
      onMaterialReady: (m) => {
        lastKnownMaterial = m;
      },
    },
  });

  if (result.status === "done" && result.materialId) {
    const mat = defaultProvider.getMaterial(result.materialId);
    if (mat) lastKnownMaterial = mat;
  }

  if (result.status === "failed") {
    return { status: "failed", error: result.error };
  }

  return {
    status: "done",
    material: lastKnownMaterial,
  };
}
