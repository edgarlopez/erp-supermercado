import { createTheme } from "@mui/material/styles";
import { esES } from "@mui/material/locale";

const theme = createTheme(
  {
    palette: {
      primary: { main: "#1b5e20" },
      secondary: { main: "#e65100" },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: "Arial, Helvetica, sans-serif",
    },
  },
  esES,
);

export default theme;
