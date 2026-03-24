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
    name: 'Atlas CMMS',
    shortName: 'Atlas',
    website: 'https://www.atlas-cmms.com',
    mail: 'contact@atlas-cmms.com',
    phone: '+212 6 30 69 00 50',
    addressStreet: '410, Boulevard Zerktouni, Hamad, №1',
    addressCity: 'Casablanca-Morocco 20040'
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
