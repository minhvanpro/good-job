import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";

const theme = createTheme({
  palette: {
    primary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5" },
    secondary: { main: "#ec4899", light: "#f472b6", dark: "#db2777" },
    background: { default: "#f1f5f9", paper: "#ffffff" },
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    "none",
    "0px 1px 2px rgba(0,0,0,0.04)",
    "0px 1px 3px rgba(0,0,0,0.06)",
    "0px 2px 4px rgba(0,0,0,0.06)",
    "0px 4px 8px rgba(0,0,0,0.06)",
    "0px 6px 12px rgba(0,0,0,0.08)",
    "0px 8px 24px rgba(0,0,0,0.08)",
    "0px 12px 32px rgba(0,0,0,0.1)",
    ...Array(17).fill("0px 4px 12px rgba(0,0,0,0.08)"),
  ] as never,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
          transition: "all 0.2s ease",
        },
        contained: {
          boxShadow: "0px 2px 8px rgba(99, 102, 241, 0.3)",
          "&:hover": {
            boxShadow: "0px 4px 16px rgba(99, 102, 241, 0.4)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          transition: "all 0.2s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "box-shadow 0.2s ease",
            "&.Mui-focused": {
              boxShadow: "0px 0px 0px 3px rgba(99, 102, 241, 0.15)",
            },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px 8px 0 0",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
