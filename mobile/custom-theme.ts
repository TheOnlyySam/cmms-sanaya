import { MD3LightTheme as DefaultTheme, useTheme } from 'react-native-paper';

export const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#06bfca',
    secondary: '#6f88a9',
    tertiary: '#9DA1A1',
    background: '#eef6f8',
    secondaryContainer: '#6f88a9',
    success: '#57CA22',
    warning: '#FFA319',
    error: '#FF1943',
    info: '#33C2FF',
    black: '#0d1f3b',
    white: '#ffffff',
    primaryAlt: '#0d1f3b',
    primaryContainer: '#0d1f3b',
    tertiaryContainer: 'black',
    grey: '#676b6b'
  }
};
export const useAppTheme = () => useTheme<typeof customTheme>();
