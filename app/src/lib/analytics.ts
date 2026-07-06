import PostHog from 'posthog-react-native';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let client: PostHog | null = null;

export function initAnalytics(): PostHog | null {
  if (client) return client;
  if (!KEY) {
    if (__DEV__) console.warn('[analytics] EXPO_PUBLIC_POSTHOG_KEY missing');
    return null;
  }
  client = new PostHog(KEY, {
    host: HOST,
    // Small batches in dev so you see events on the dashboard fast;
    // larger batches in prod to save bandwidth.
    flushAt: __DEV__ ? 1 : 20,
    flushInterval: __DEV__ ? 3000 : 10000,
    captureAppLifecycleEvents: true,
    enableSessionReplay: false,
  });
  if (__DEV__) console.log('[analytics] PostHog initialised for', HOST);
  return client;
}

export function track(event: string, properties?: Record<string, unknown>) {
  const c = client ?? initAnalytics();
  c?.capture(event, properties);
}

export function identify(distinctId: string, properties?: Record<string, unknown>) {
  const c = client ?? initAnalytics();
  c?.identify(distinctId, properties);
}

export function resetAnalytics() {
  client?.reset();
}
