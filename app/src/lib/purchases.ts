import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';

// The RevenueCat SDK is a native module — it can't run inside Expo Go.
// We keep the module reference behind a dynamic import so a missing
// native binary just leaves `configured` false and every helper below
// becomes a no-op the callers already handle.
let Purchases: any = null;

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const isExpoGo = Constants.appOwnership === 'expo';
let configured = false;

const ENTITLEMENT_ID = 'pro';

function activeKey(): string | null {
  if (Platform.OS === 'ios') return IOS_KEY ?? null;
  if (Platform.OS === 'android') return ANDROID_KEY ?? null;
  return null;
}

export function isConfigured(): boolean {
  return configured;
}

export async function configurePurchases(userId?: string): Promise<boolean> {
  if (isExpoGo) return false;
  const key = activeKey();
  if (!key) return false;
  try {
    if (!Purchases) {
      const rc = await import('react-native-purchases');
      Purchases = rc.default;
    }
    await Purchases.configure({ apiKey: key, appUserID: userId ?? null });
    configured = true;
    return true;
  } catch (e) {
    Sentry.captureException(e);
    return false;
  }
}

export async function linkUser(userId: string): Promise<void> {
  if (!configured || !Purchases) return;
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    Sentry.captureException(e);
  }
}

export async function unlinkUser(): Promise<void> {
  if (!configured || !Purchases) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    Sentry.captureException(e);
  }
}

export type Package = {
  identifier: string;
  priceString: string;
  productIdentifier: string;
  raw: any;
};

export type Offering = {
  identifier: string;
  packages: Package[];
};

export async function getCurrentOffering(): Promise<Offering | null> {
  if (!configured || !Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;
    return {
      identifier: current.identifier,
      packages: current.availablePackages.map((p: any) => ({
        identifier: p.identifier,
        priceString: p.product.priceString,
        productIdentifier: p.product.identifier,
        raw: p,
      })),
    };
  } catch (e) {
    Sentry.captureException(e);
    return null;
  }
}

export type PurchaseResult = {
  ok: boolean;
  cancelled?: boolean;
  entitlementActive?: boolean;
  expiresDate?: string | null;
  error?: string;
};

export async function purchasePackage(pkg: Package): Promise<PurchaseResult> {
  if (!configured || !Purchases) {
    return { ok: false, error: 'Purchases not configured.' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg.raw);
    const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
    return {
      ok: true,
      entitlementActive: !!entitlement,
      expiresDate: entitlement?.expirationDate ?? null,
    };
  } catch (e: any) {
    if (e?.userCancelled) return { ok: false, cancelled: true };
    Sentry.captureException(e);
    return { ok: false, error: e?.message ?? 'Purchase failed.' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!configured || !Purchases) {
    return { ok: false, error: 'Purchases not configured.' };
  }
  try {
    const info = await Purchases.restorePurchases();
    const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
    return {
      ok: true,
      entitlementActive: !!entitlement,
      expiresDate: entitlement?.expirationDate ?? null,
    };
  } catch (e: any) {
    Sentry.captureException(e);
    return { ok: false, error: e?.message ?? 'Restore failed.' };
  }
}

// Push the current entitlement state into the Supabase profile so
// hasAccess() reads consistently across devices without a per-render RC
// round-trip. Fire this on sign-in, after purchase, and after restore.
export async function syncEntitlementToProfile(userId: string): Promise<void> {
  if (!configured || !Purchases) return;
  try {
    const info = await Purchases.getCustomerInfo();
    const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
    const isPremium = !!entitlement;
    const premiumUntil = entitlement?.expirationDate ?? null;
    await supabase
      .from('profiles')
      .update({ is_premium: isPremium, premium_until: premiumUntil })
      .eq('id', userId);
  } catch (e) {
    Sentry.captureException(e);
  }
}
