import { describe, expect, it } from "vitest";
import {
  checkPan,
  normalizeMobileInput,
  normalizePanInput,
  validateMobile,
  validatePan,
} from "./validation";

describe("PAN shape", () => {
  it("accepts a well-formed individual PAN", () => {
    const check = checkPan("ABCPE1234F");
    expect(check.status).toBe("valid");
    if (check.status === "valid") expect(check.holder).toBe("an individual");
  });

  it("accepts the example PAN the field itself shows", () => {
    // "D" in slot 4 is not a holder code we recognise, and must still pass.
    expect(checkPan("ABCDE1234F").status).toBe("valid");
    expect(validatePan("ABCDE1234F")).toBeNull();
  });

  it("uppercases and strips the spaces PANs get written with", () => {
    expect(normalizePanInput("abcde 1234 f")).toBe("ABCDE1234F");
  });

  it("counts a 9-character entry instead of restating the format", () => {
    // The reported case: 5 letters, only 3 digits, 1 letter.
    const check = checkPan("KMFPK304L");
    expect(check.status).toBe("incomplete");
    if (check.status === "incomplete") expect(check.message).toContain("9 of 10");
  });

  it("leaves a short entry alone rather than inventing a digit", () => {
    // The trailing L sits in a digit slot here only because a digit is missing,
    // so repairing it would manufacture a different, wrong PAN.
    expect(normalizePanInput("KMFPK3O4L")).toBe("KMFPK3O4L");
  });
});

describe("PAN look-alike repair", () => {
  it("reads a letter O in the digit block as a zero", () => {
    expect(normalizePanInput("ABCDE12O4F")).toBe("ABCDE1204F");
  });

  it("reads I and L in the digit block as ones", () => {
    expect(normalizePanInput("ABCDEI23LF")).toBe("ABCDE1231F");
  });

  it("reads a zero in the letter block as the letter O", () => {
    expect(normalizePanInput("ABC0E1234F")).toBe("ABCOE1234F");
  });

  it("repairs a full-length paste into a valid PAN", () => {
    expect(checkPan("abcde12o4f").status).toBe("valid");
  });
});

describe("PAN holder type (character 4)", () => {
  it("passes a HUF PAN, which also files these returns", () => {
    const check = checkPan("ABCHE1234F");
    expect(check.status).toBe("valid");
    if (check.status === "valid") expect(check.holder).toBe("a Hindu Undivided Family (HUF)");
  });

  it("names the holder when a company PAN is entered", () => {
    const check = checkPan("ABCCE1234F");
    expect(check.status).toBe("mismatch");
    if (check.status === "mismatch") {
      expect(check.holder).toBe("a company");
      expect(check.message).toContain("a company");
    }
  });

  it("does not block on a company PAN, since the number itself is real", () => {
    expect(validatePan("ABCCE1234F")).toBeNull();
  });

  it("accepts an unrecognised holder code rather than blocking it", () => {
    const check = checkPan("ABCKE1234F");
    expect(check.status).toBe("valid");
    if (check.status === "valid") expect(check.holder).toBeNull();
  });
});

describe("PAN block-level diagnosis", () => {
  it("points at the digit block when it holds letters", () => {
    const check = checkPan("ABCDEXXXXF");
    expect(check.status).toBe("invalid");
    if (check.status === "invalid") expect(check.message).toContain("Characters 6 to 9");
  });

  it("points at the last character when it is a digit", () => {
    const check = checkPan("ABCDE12345");
    expect(check.status).toBe("invalid");
    if (check.status === "invalid") expect(check.message).toContain("ends in a letter");
  });

  it("treats an empty field as empty, not wrong", () => {
    expect(checkPan("").status).toBe("empty");
    expect(validatePan("")).toBeNull();
  });
});

describe("Indian mobile numbers", () => {
  it("keeps a bare 10-digit number", () => {
    expect(normalizeMobileInput("9876543210")).toBe("9876543210");
  });

  it("strips a +91 country code with spaces, the bug behind truncated numbers", () => {
    expect(normalizeMobileInput("+91 98765 43210")).toBe("9876543210");
  });

  it("strips a leading zero", () => {
    expect(normalizeMobileInput("098765 43210")).toBe("9876543210");
  });

  it("strips a zero and a country code together", () => {
    expect(normalizeMobileInput("0919876543210")).toBe("9876543210");
  });

  it("keeps a real number that happens to start with 91", () => {
    expect(normalizeMobileInput("9198765432")).toBe("9198765432");
  });

  it("accepts every valid opening digit", () => {
    for (const first of ["6", "7", "8", "9"]) {
      expect(validateMobile(`${first}123456789`)).toBeNull();
    }
  });

  it("rejects an opening digit no Indian series uses", () => {
    expect(validateMobile("5123456789")).toContain("6, 7, 8 or 9");
  });

  it("counts progress on a short number", () => {
    expect(validateMobile("98765")).toContain("5 of 10");
  });

  it("treats a blank optional number as fine", () => {
    expect(validateMobile("")).toBeNull();
  });
});
