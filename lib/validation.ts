// lib/validation.ts
// Zod schemas for user-entered fields. Validation is friendly and non-blocking:
// the wizard flags issues but never loses the user's place.

import { z } from "zod";

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** Indian mobile series are 10 digits opening with 6, 7, 8 or 9. */
export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;

/**
 * Character 4 of a PAN records who the number belongs to. Reading it lets us
 * answer "why is my PAN rejected" with the actual reason instead of restating
 * the format, which matters most for the common slip of entering the PAN of a
 * company or a firm you run rather than your own.
 *
 * Treat this table as recognition only, never as the set of legal codes: the
 * department has added codes over time, so an entry we do not know is accepted
 * rather than refused. Being unhelpful about a rare PAN beats blocking it.
 */
export const PAN_HOLDER_TYPES: Record<string, string> = {
  P: "an individual",
  H: "a Hindu Undivided Family (HUF)",
  C: "a company",
  F: "a firm or LLP",
  A: "an association of persons",
  T: "a trust",
  B: "a body of individuals",
  L: "a local authority",
  J: "an artificial juridical person",
  G: "a government body",
};

/** ITR-1 to ITR-4 are returns an individual or a HUF files for themselves. */
const SELF_FILING_HOLDERS = new Set(["P", "H"]);

/**
 * A PAN's shape is rigid: slots 1 to 5 and slot 10 are always letters, slots 6
 * to 9 are always digits. That makes the O/0 and I/1 mix-ups people produce
 * when copying off the card unambiguous to repair, because in a digit slot an
 * "O" can only ever have meant "0". Only these look-alike pairs are repaired.
 * Any other wrong-class character is left as typed so a real typo surfaces as
 * an error rather than being silently rewritten into a different PAN.
 */
const LETTER_TO_DIGIT: Record<string, string> = { O: "0", I: "1", L: "1" };
const DIGIT_TO_LETTER: Record<string, string> = { "0": "O", "1": "I" };

/** True for the 0-based slots that must hold a digit (characters 6 to 9). */
const slotWantsDigit = (index: number) => index >= 5 && index <= 8;

/**
 * Reduce anything pasted or typed into PAN shape: uppercase, alphanumeric only,
 * at most 10 characters, with look-alike characters moved into the right class.
 * The result is what the user sees in the field, so every repair stays visible.
 */
export function normalizePanInput(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  // Reclassify only at full length. A half-typed PAN that is short a digit must
  // not have its trailing letter rewritten into one: that would swap a visible
  // "you are missing a character" for an invisibly wrong but plausible PAN.
  if (cleaned.length < 10) return cleaned;
  return cleaned
    .split("")
    .map((ch, i) => (slotWantsDigit(i) ? (LETTER_TO_DIGIT[ch] ?? ch) : (DIGIT_TO_LETTER[ch] ?? ch)))
    .join("");
}

/**
 * Accept the ways an Indian mobile number gets written (+91, 91, a leading 0,
 * spaces, dashes) and reduce it to the bare 10 digits. Without this, pasting
 * "+91 98765 43210" lands a truncated, wrong number in the field.
 */
export function normalizeMobileInput(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "").replace(/^0+/, "");
  // Only treat a leading 91 as the country code when digits remain beyond the
  // 10 a number needs, since 91xxxxxxxx is itself a valid mobile number.
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export type PanCheck =
  /** Nothing entered. PAN is required to file but the wizard never nags early. */
  | { status: "empty" }
  /** Fewer than 10 characters. Expected mid-typing, so not an error yet. */
  | { status: "incomplete"; message: string }
  /** Full length but malformed. The message names the offending block. */
  | { status: "invalid"; message: string }
  /** A structurally real PAN, but not one you file your own return with. */
  | { status: "mismatch"; message: string; holder: string }
  /** Correctly shaped. `holder` is null when character 4 is a code we do not know. */
  | { status: "valid"; message: string; holder: string | null };

/**
 * Diagnose a PAN precisely enough to tell the user what to change. Callers use
 * `status` to decide how loudly to say it: `incomplete` is a progress note
 * while typing, `mismatch` is a warning about a valid-but-wrong PAN.
 */
export function checkPan(value: string): PanCheck {
  const pan = normalizePanInput(value);
  if (!pan) return { status: "empty" };

  if (pan.length < 10) {
    return {
      status: "incomplete",
      message: `${pan.length} of 10 characters. A PAN is 5 letters, then 4 digits, then 1 letter.`,
    };
  }

  if (!PAN_REGEX.test(pan)) {
    const digits = pan.slice(5, 9);
    if (!/^[A-Z]{5}$/.test(pan.slice(0, 5))) {
      return {
        status: "invalid",
        message: "The first 5 characters of a PAN are letters. Check the start of yours.",
      };
    }
    if (!/^[0-9]{4}$/.test(digits)) {
      return {
        status: "invalid",
        message: `Characters 6 to 9 of a PAN are digits, but yours read "${digits}".`,
      };
    }
    return { status: "invalid", message: "A PAN ends in a letter, not a digit." };
  }

  const code = pan.charAt(3);
  const holder = PAN_HOLDER_TYPES[code] ?? null;
  if (holder && !SELF_FILING_HOLDERS.has(code)) {
    return {
      status: "mismatch",
      holder,
      message: `The 4th character, ${code}, means this PAN belongs to ${holder}. ITR-1 to ITR-4 are filed by individuals, so use your personal PAN.`,
    };
  }
  return {
    status: "valid",
    holder,
    message: holder ? (code === "P" ? "Individual PAN." : "HUF PAN.") : "The format looks right.",
  };
}

export const panSchema = z
  .string()
  .transform(normalizePanInput)
  .refine((s) => s === "" || PAN_REGEX.test(s), {
    message: "A PAN looks like ABCDE1234F (5 letters, 4 digits, 1 letter).",
  });

export const emailSchema = z
  .string()
  .refine((s) => s === "" || z.string().email().safeParse(s).success, {
    message: "That email doesn't look right.",
  });

export const mobileSchema = z
  .string()
  .transform(normalizeMobileInput)
  .refine((s) => s === "" || MOBILE_REGEX.test(s), {
    message: "Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.",
  });

/**
 * The blocking check, used to gate the wizard and the review page. A holder-type
 * mismatch is deliberately not blocking: the PAN is real, so we warn instead of
 * standing between the user and their return.
 */
export function validatePan(value: string): string | null {
  const check = checkPan(value);
  return check.status === "incomplete" || check.status === "invalid" ? check.message : null;
}

export function validateEmail(value: string): string | null {
  const r = emailSchema.safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? "Invalid email.");
}

export function validateMobile(value: string): string | null {
  const mobile = normalizeMobileInput(value);
  if (mobile === "") return null;
  if (mobile.length < 10) return `${mobile.length} of 10 digits.`;
  if (!MOBILE_REGEX.test(mobile)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
  return null;
}

/** Age band from date of birth, measured on the last day of FY 2025-26 (31 Mar 2026). */
export function ageBandFromDob(dobIso: string): "below60" | "senior60to80" | "superSenior80plus" | null {
  if (!dobIso) return null;
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const ref = new Date("2026-03-31");
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
  if (age >= 80) return "superSenior80plus";
  if (age >= 60) return "senior60to80";
  return "below60";
}
