import { apiUrl, BrandRawConfig, brandRawConfig, customLogoPaths } from "../config";
import { LicenseEntitlement, LicensingState } from "../models/owns/license";

const DEFAULT_WHITE_LOGO = "/static/images/logo/logo-white.png";
const DEFAULT_DARK_LOGO = "/static/images/logo/logo.png";
const CUSTOM_DARK_LOGO = `${apiUrl}images/custom-logo.png`;
const CUSTOM_WHITE_LOGO = `${apiUrl}images/custom-logo-white.png`;
import { cache } from "react";

interface LicenseState {
  state: LicensingState;
}
const initialState: LicenseState = {
  state: {
    valid: false,
    entitlements: [],
    expirationDate: null,
    planName: null,
  },
};
export const getLicenseValidityServer = cache(async (): Promise<LicensingState> => {
  try {
    const response = await fetch(`${apiUrl}license/state`, {
      next: { revalidate: 3600 * 24 },
    });
    if (!response.ok) return initialState.state;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch license server-side:", error);
    return initialState.state;
  }
});
export interface BrandConfig extends BrandRawConfig {
  logo: { white: string; dark: string };
}

export async function getBrandServer(): Promise<BrandConfig> {
  const defaultBrand: Omit<BrandConfig, "logo"> = {
    name: "SyncShield CMMS",
    shortName: "SyncShield",
    website: "https://www.syncshield.io",
    mail: "contact@syncshield.io",
    phone: "",
    addressStreet: "",
    addressCity: "",
  };

  const licensingState = await getLicenseValidityServer();
  const isLicenseValid =
    licensingState.valid && licensingState.entitlements.some((e: LicenseEntitlement) => e === "BRANDING");
  const activeLogo = customLogoPaths
    ? {
        white: CUSTOM_WHITE_LOGO,
        dark: CUSTOM_DARK_LOGO,
      }
    : {
        white: DEFAULT_WHITE_LOGO,
        dark: DEFAULT_DARK_LOGO,
      };

  return {
    logo: activeLogo,
    ...(isLicenseValid && brandRawConfig ? brandRawConfig : defaultBrand),
  };
}
