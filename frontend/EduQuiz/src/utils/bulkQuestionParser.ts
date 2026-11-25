import type { ParsedBulkQuestion } from "../types/quiz";

const LABELS: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];

/**
 * Parses pasted multi-question text matching Figma `EduQuiz_DanNhieuCau` (281:1782):
 *   Câu 1. Đạo hàm của y = x² là?
 *   A. x
 *   *B. 2x
 *   C. x²
 *   D. 2
 */
export function parseBulkQuestions(rawText: string): ParsedBulkQuestion[] {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized
    .split(/(?=(?:^|\n)\s*(?:Câu|Cau)\s+\d+\s*[.:])/i)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks.map((block, idx) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const promptLines: string[] = [];
    const options: ParsedBulkQuestion["options"] = [];

    for (const line of lines) {
      const optMatch = line.match(/^(\*)?\s*([A-Da-d])\s*[.):]\s*(.+)$/);
      if (optMatch) {
        const hasStarPrefix = Boolean(optMatch[1]);
        const label = optMatch[2].toUpperCase() as "A" | "B" | "C" | "D";
        let content = optMatch[3].trim();
        let hasStarSuffix = false;
        if (content.endsWith("*")) {
          hasStarSuffix = true;
          content = content.slice(0, -1).trim();
        }
        options.push({
          label,
          content,
          isCorrect: hasStarPrefix || hasStarSuffix,
        });
      } else {
        promptLines.push(
          promptLines.length === 0
            ? line.replace(/^(?:Câu|Cau)\s+\d+\s*[.:]\s*/i, "").trim()
            : line,
        );
      }
    }

    const content = promptLines.join(" ").trim();
    const errors: string[] = [];
    if (!content) errors.push("Thiếu nội dung câu hỏi");
    if (options.length < 2) errors.push("Cần ít nhất 2 đáp án (A, B, C, D)");
    if (!options.some((o) => o.isCorrect)) {
      errors.push("Chưa đánh dấu đáp án đúng bằng dấu * (ví dụ: *B. 2x)");
    }

    // Preserve deterministic A..D ordering when present
    options.sort((a, b) => LABELS.indexOf(a.label) - LABELS.indexOf(b.label));

    return { index: idx + 1, content, options, errors };
  });
}
