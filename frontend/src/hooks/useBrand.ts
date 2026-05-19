import {
  apiUrl,
  BrandRawConfig,
  brandRawConfig,
  customLogoPaths
} from '../config';
import { useLicenseEntitlement } from './useLicenseEntitlement';

const DEFAULT_WHITE_LOGO = '/static/images/logo/logo-white.png';
const DEFAULT_DARK_LOGO = '/static/images/logo/logo.png';
const CUSTOM_DARK_LOGO = `${apiUrl}images/custom-logo.png`;
const CUSTOM_WHITE_LOGO = `${apiUrl}images/custom-logo-white.png`;

interface BrandConfig extends BrandRawConfig {
  logo: { white: string; dark: string };
}
export function useBrand(): BrandConfig {
  const defaultBrand: Omit<BrandConfig, 'logo'> = {
    name: 'SyncShield CMMS',
    shortName: 'SyncShield',
    website: 'https://www.syncshield.io',
    mail: 'contact@syncshield.io',
    phone: '',
    addressStreet: '',
    addressCity: ''
  };
  const isLicenseValid = useLicenseEntitlement('BRANDING');
  const activeLogo = customLogoPaths
    ? {
        white: CUSTOM_WHITE_LOGO,
        dark: CUSTOM_DARK_LOGO
      }
    : {
        white: DEFAULT_WHITE_LOGO,
        dark: DEFAULT_DARK_LOGO
      };
  return {
    logo: activeLogo,
    ...(isLicenseValid && brandRawConfig ? brandRawConfig : defaultBrand)
  };
}
