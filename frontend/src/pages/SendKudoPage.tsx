import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Slider,
  Alert,
  Chip,
  Avatar,
  CircularProgress,
  IconButton,
  Fade,
  Grow,
} from "@mui/material";
import {
  Send,
  AttachFile,
  Close,
  Image,
  Videocam,
  CheckCircle,
} from "@mui/icons-material";
import { kudoApi, userApi, uploadApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types";
import { CORE_VALUES, CORE_VALUE_COLORS } from "../constants";

export default function SendKudoPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [toUserId, setToUserId] = useState("");
  const [points, setPoints] = useState(10);
  const [description, setDescription] = useState("");
  const [coreValue, setCoreValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ url: string; type: "image" | "video"; duration?: number }>>([]);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userApi.list();
        const allUsers = res.data.data || [];
        setUsers(allUsers.filter((u: User) => u.id !== user?.id));
      } catch {
        // silently fail
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [user?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (f.type.startsWith("video/")) {
        if (f.size > 50 * 1024 * 1024) {
          setError("Video files must be under 50MB (approx. 3 minutes)");
          return false;
        }
      }
      return true;
    });
    setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilePreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId || !description || !coreValue) {
      setError("Please fill in all required fields");
      return;
    }
    if (toUserId === user?.id) {
      setError("You cannot send a kudo to yourself");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let mediaUrls = uploadedMedia;
      if (selectedFiles.length > 0) {
        setUploading(true);
        const uploadRes = await uploadApi.upload(selectedFiles);
        mediaUrls = uploadRes.data.data || [];
        setUploading(false);
      }

      await kudoApi.create({
        toUserId,
        points,
        description,
        coreValue,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to send kudo";
      setError(message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === toUserId);

  if (success) {
    return (
      <Fade in timeout={500}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Kudo Sent! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Redirecting to feed...
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3}>
        Send a Kudo 🎉
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Who do you want to recognize?
            </Typography>
            <TextField
              select
              fullWidth
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              required
              sx={{ mb: 3 }}
              disabled={loadingUsers}
              InputProps={{
                startAdornment: selectedUser ? (
                  <Box display="flex" alignItems="center" gap={1} mr={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                      {selectedUser.name.charAt(0)}
                    </Avatar>
                  </Box>
                ) : undefined,
              }}
            >
              {loadingUsers ? (
                <MenuItem disabled>Loading users...</MenuItem>
              ) : users.length === 0 ? (
                <MenuItem disabled>
                  No users found. Send some kudos first to discover users!
                </MenuItem>
              ) : (
                users
                  .filter((u) => u.id !== user?.id)
                  .map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </MenuItem>
                  ))
              )}
            </TextField>

            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Points: <strong>{points}</strong>
            </Typography>
            <Slider
              value={points}
              onChange={(_, v) => setPoints(v as number)}
              min={10}
              max={50}
              step={5}
              marks={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 30, label: "30" },
                { value: 40, label: "40" },
                { value: 50, label: "50" },
              ]}
              sx={{
                mb: 3,
                color: points > 30 ? "secondary.main" : "primary.main",
                "& .MuiSlider-markLabel": { fontWeight: 500 },
              }}
            />

            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Which core value does this reflect?
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
              {CORE_VALUES.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  onClick={() => setCoreValue(value)}
                  variant={coreValue === value ? "filled" : "outlined"}
                  sx={{
                    bgcolor: coreValue === value ? CORE_VALUE_COLORS[value] : undefined,
                    color: coreValue === value ? "#fff" : undefined,
                    borderColor: CORE_VALUE_COLORS[value],
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: coreValue === value ? `0px 2px 8px ${CORE_VALUE_COLORS[value]}40` : undefined,
                    },
                  }}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Why do they deserve this kudo?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Describe what they did well..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500`}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Attach Media (optional)
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Images or videos up to 3 minutes. Max 5 files.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {selectedFiles.map((file, index) => (
                <Grow in key={index} timeout={300}>
                  <Box
                    sx={{
                      position: "relative",
                      width: 90,
                      height: 90,
                      borderRadius: 2,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "action.hover",
                    }}
                  >
                    {file.type.startsWith("video/") ? (
                      <Videocam sx={{ fontSize: 36, color: "primary.main" }} />
                    ) : file.type.startsWith("image/") ? (
                      <Box
                        component="img"
                        src={getFilePreviewUrl(file)}
                        alt="Preview"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <AttachFile sx={{ fontSize: 36, color: "primary.main" }} />
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        bgcolor: "rgba(0,0,0,0.5)",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                      }}
                      onClick={() => removeFile(index)}
                    >
                      <Close sx={{ fontSize: 14, color: "#fff" }} />
                    </IconButton>
                  </Box>
                </Grow>
              ))}
              {selectedFiles.length < 5 && (
                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    width: 90,
                    height: 90,
                    borderRadius: 2,
                    minWidth: "auto",
                    borderStyle: "dashed",
                    borderColor: "primary.main",
                    "&:hover": {
                      borderStyle: "dashed",
                      bgcolor: "rgba(99, 102, 241, 0.04)",
                    },
                  }}
                >
                  <Box textAlign="center">
                    <AttachFile sx={{ fontSize: 24, color: "primary.main", display: "block", mb: 0.5 }} />
                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                      Add
                    </Typography>
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    onChange={handleFileSelect}
                  />
                </Button>
              )}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting || uploading || !toUserId || !description || !coreValue}
              startIcon={
                submitting || uploading ? <CircularProgress size={20} color="inherit" /> : <Send />
              }
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: 16,
              }}
            >
              {uploading ? "Uploading files..." : submitting ? "Sending..." : "Send Kudo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
