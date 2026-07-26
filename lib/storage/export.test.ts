import { describe, expect, it } from "vitest";
import { buildExportFile, parseImportFile } from "./index";
import { createDefaultData } from "@/store";

describe("progress export / import", () => {
  it("round-trips a session through the .filio.json format", () => {
    const data = createDefaultData();
    data.personal.fullName = "Asha Kumar";
    data.salary.grossSalary = 800000;
    data.updatedAt = 1_700_000_000_000;

    const file = buildExportFile(data);
    expect(file.app).toBe("filio");
    expect(file.schema).toBe(1);

    const restored = parseImportFile(JSON.stringify(file));
    expect(restored.personal.fullName).toBe("Asha Kumar");
    expect(restored.salary.grossSalary).toBe(800000);
  });

  it("rejects a file that isn't a Filio export", () => {
    expect(() => parseImportFile('{"hello":"world"}')).toThrow(/Filio progress file/i);
  });

  it("rejects invalid JSON with a friendly message", () => {
    expect(() => parseImportFile("not json")).toThrow(/valid JSON/i);
  });
});
