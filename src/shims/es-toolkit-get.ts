// Shim to provide a default export for es-toolkit/compat/get expected by some libs (e.g., Recharts)
// Replace with real backend logic or remove when dependency versions are aligned.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - es-toolkit types may not expose this path
import { get } from 'es-toolkit/compat';

export default get;
export { get };
