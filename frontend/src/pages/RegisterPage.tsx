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
  LinearProgress,
} from "@mui/material";
import { Visibility, VisibilityOff, PersonAdd } from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (p: string): number => {
    let score = 0;
    if (p.length >= 6) score += 25;
    if (p.length >= 10) score += 15;
    if (/[A-Z]/.test(p)) score += 20;
    if (/[0-9]/.test(p)) score += 20;
    if (/[^A-Za-z0-9]/.test(p)) score += 20;
    return Math.min(score, 100);
  };

  const strength = getStrength(password);
  const color = strength < 40 ? "error" : strength < 70 ? "warning" : "success";
  const label = strength < 40 ? "Weak" : strength < 70 ? "Medium" : "Strong";

  if (!password) return null;

  return (
    <Box mb={2}>
      <LinearProgress
        variant="determinate"
        value={strength}
        color={color}
        sx={{ height: 4, borderRadius: 2, mb: 0.5 }}
      />
      <Typography variant="caption" color={`${color}.main`} fontWeight={600}>
        {label}
      </Typography>
    </Box>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register(email, name, password);
      navigate("/");
    } catch {
      // no-op: error is set in store
    }
  };

  const displayError = localError || error;

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
              Create your account
            </Typography>

            {displayError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {displayError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="At least 6 characters"
                sx={{ mb: 1 }}
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
              <PasswordStrength password={password} />
              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                error={!!confirmPassword && password !== confirmPassword}
                helperText={!!confirmPassword && password !== confirmPassword ? "Passwords do not match" : ""}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={<PersonAdd />}
                sx={{ py: 1.5, borderRadius: 2, textTransform: "none", fontSize: 16 }}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" mt={2}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#6366f1", fontWeight: 600 }}>
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
