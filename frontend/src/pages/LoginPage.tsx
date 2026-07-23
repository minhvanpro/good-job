import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Fade,
} from "@mui/material";
import { Visibility, VisibilityOff, Login as LoginIcon } from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch {
      // no-op: error is set in store
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          width: "200%",
          height: "200%",
          background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)",
          animation: "pulse 8s ease-in-out infinite",
        },
        "@keyframes pulse": {
          "0%, 100%": { transform: "translate(-25%, -25%)" },
          "50%": { transform: "translate(0%, 0%)" },
        },
      }}
    >
      <Fade in timeout={600}>
        <Card sx={{ maxWidth: 420, width: "100%", mx: 2, borderRadius: 3, position: "relative", zIndex: 1 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom
              sx={{
                background: "linear-gradient(135deg, #6366f1, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              👏 Good Job!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              Sign in to your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={<LoginIcon />}
                sx={{ py: 1.5, borderRadius: 2, textTransform: "none", fontSize: 16 }}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" mt={2}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "#6366f1", fontWeight: 600 }}>
                Sign Up
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
