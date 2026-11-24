import { format, formatDistance } from "date-fns";
import { es } from "date-fns/locale";

/** Formats a date as a long Spanish absolute date (e.g. "9 de julio de 2026"). */
export function formatDate(
    date: Date | string | number | null | undefined,
): string {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";
    return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formats a date as a Spanish relative distance from `now` with a suffix
 * (e.g. "hace 5 días", "hace alrededor de 1 mes"). Empty string for nullish or
 * unparseable input.
 *
 * @param date - Date, ISO string, epoch ms, or nullish.
 * @param now - Reference epoch ms (injectable for tests); defaults to `Date.now()`.
 */
export function formatRelativeTime(
    date: Date | string | number | null | undefined,
    now: number = Date.now(),
): string {
    if (!date) return "";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "";

    return formatDistance(parsed, now, { addSuffix: true, locale: es });
}

export function formatNumber(num: number): string {
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Formats a duration in seconds as `m:ss` (or `h:mm:ss` past an hour), e.g.
 * `252` → `"4:12"`.
 */
export function formatDuration(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    const paddedSeconds = String(seconds).padStart(2, "0");
    if (hours > 0) {
        const paddedMinutes = String(minutes).padStart(2, "0");
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${minutes}:${paddedSeconds}`;
}
