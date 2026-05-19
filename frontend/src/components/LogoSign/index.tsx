import {
  Box,
  styled,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useBrand } from '../../hooks/useBrand';

const LogoWrapper = styled('a')(
  ({ theme }) => `
        color: ${theme.palette.text.primary};
        display: flex;
        text-decoration: none;
        align-items: center;
        width: auto;
        max-width: 180px;
        margin: 0 auto;
        font-weight: ${theme.typography.fontWeightBold};
`
);

const AuthLogoWrapper = styled(Box)(
  () => `
        display: flex;
        justify-content: center;
        width: 100%;
        margin: 0 auto 14px;
        text-align: center;
`
);

const LogoSignWrapper = styled(Box)(
  () => `
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 52px;
        height: 52px;
`
);

const TooltipWrapper = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.colors.alpha.trueWhite[100],
    color: theme.palette.getContrastText(theme.colors.alpha.trueWhite[100]),
    fontSize: theme.typography.pxToRem(12),
    fontWeight: 'bold',
    borderRadius: theme.general.borderRadiusSm,
    boxShadow:
      '0 .2rem .8rem rgba(7,9,25,.18), 0 .08rem .15rem rgba(7,9,25,.15)'
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.colors.alpha.trueWhite[100]
  }
}));
interface OwnProps {
  white?: boolean;
  auth?: boolean;
}

function Logo({ white, auth = false }: OwnProps) {
  const theme = useTheme();
  const width = auth ? 280 : 170;
  const height = auth ? 54 : 46;
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { logo, name: brandName } = useBrand();

  const logoLink = (
    <TooltipWrapper title={brandName} arrow>
      <LogoWrapper
        href="/app/work-orders"
        sx={{
          maxWidth: auth ? 'none' : 180,
          width: auth ? `${width * (mobile ? 0.7 : 1)}px` : 'auto',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <LogoSignWrapper
          sx={{
            width: auth ? `${width * (mobile ? 0.7 : 1)}px` : 'auto',
            height: auth ? 62 : 52,
            minWidth: auth ? 0 : 52,
            mb: 0
          }}
        >
          <img
            src={white ? logo.white : logo.dark}
            width={`${width * (mobile ? 0.7 : 1)}px`}
            height={`${height * (mobile ? 0.7 : 1)}px`}
            alt={'logo'}
            style={{
              display: 'block',
              objectFit: 'contain',
              transform: auth ? 'translateX(18px)' : undefined
            }}
          />
        </LogoSignWrapper>
      </LogoWrapper>
    </TooltipWrapper>
  );

  return auth ? <AuthLogoWrapper>{logoLink}</AuthLogoWrapper> : logoLink;
}

export default Logo;
