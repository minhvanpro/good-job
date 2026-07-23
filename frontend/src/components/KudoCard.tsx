import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Avatar,
  Box,
  IconButton,
  TextField,
  Button,
  Collapse,
  Divider,
  Tooltip,
  Dialog,
  DialogContent,
  Zoom,
  Popover,
} from "@mui/material";
import {
  Comment as CommentIcon,
  Send,
  Close,
  AddReaction,
  ThumbUp,
  Favorite,
  Celebration,
  Whatshot,
  FitnessCenter,
  Star,
} from "@mui/icons-material";
import type { Kudo } from "../types";
import { kudoApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { CORE_VALUE_COLORS, REACTION_ICONS } from "../constants";

interface KudoCardProps {
  kudo: Kudo;
  onReactionUpdate?: (kudoId: string, reactions: Kudo["reactions"]) => void;
  onCommentUpdate?: (kudoId: string, comments: Kudo["comments"]) => void;
}

export default function KudoCard({
  kudo,
  onReactionUpdate,
  onCommentUpdate,
}: KudoCardProps) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const addReactionRef = useRef<HTMLButtonElement>(null);

  const userReactions = kudo.reactions.filter((r) => r.user.id === user?.id);
  const reactionCounts = kudo.reactions.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.icon] = (acc[r.icon] || 0) + 1;
      return acc;
    },
    {},
  );

  const reactionIconMap: Record<string, React.ReactNode> = {
    thumb_up: <ThumbUp fontSize="small" />,
    favorite: <Favorite fontSize="small" />,
    celebration: <Celebration fontSize="small" />,
    whatshot: <Whatshot fontSize="small" />,
    fitness_center: <FitnessCenter fontSize="small" />,
    star: <Star fontSize="small" />,
  };

  const reactionColors: Record<string, string> = {
    thumb_up: "#3b82f6",
    favorite: "#ef4444",
    celebration: "#f59e0b",
    whatshot: "#f97316",
    fitness_center: "#10b981",
    star: "#eab308",
  };

  const handleReact = async (icon: string) => {
    setPickerAnchor(null);
    try {
      if (userReactions.some((r) => r.icon === icon)) {
        await kudoApi.removeReaction(kudo.id, icon);
        const updated = kudo.reactions.filter(
          (r) => !(r.icon === icon && r.user.id === user?.id),
        );
        onReactionUpdate?.(kudo.id, updated);
      } else {
        const res = await kudoApi.react(kudo.id, icon);
        onReactionUpdate?.(kudo.id, [...kudo.reactions, res.data.data!]);
      }
    } catch {
      // silently fail
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await kudoApi.comment(kudo.id, { content: commentText });
      onCommentUpdate?.(kudo.id, [...kudo.comments, res.data.data!]);
      setCommentText("");
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          mb: 2,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0px 8px 24px rgba(0,0,0,0.08)",
          },
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "primary.main",
                  fontSize: 13,
                }}
              >
                {kudo.fromUser.name.charAt(0)}
              </Avatar>
              <Typography variant="subtitle2" fontWeight={600}>
                {kudo.fromUser.name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              →
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "secondary.main",
                  fontSize: 13,
                }}
              >
                {kudo.toUser.name.charAt(0)}
              </Avatar>
              <Typography variant="subtitle2" fontWeight={600}>
                {kudo.toUser.name}
              </Typography>
            </Box>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={1.5}
            flexWrap="wrap"
          >
            <Chip
              label={kudo.coreValue}
              size="small"
              sx={{
                bgcolor: CORE_VALUE_COLORS[kudo.coreValue] || "#6366f1",
                color: "#fff",
                fontWeight: 600,
                fontSize: 11,
                height: 24,
              }}
            />
            <Chip
              label={`+${kudo.points} pts`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, fontSize: 11, height: 24 }}
            />
            <Typography variant="caption" color="text.secondary">
              {timeAgo(kudo.createdAt)}
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              mb: 1.5,
              lineHeight: 1.6,
              color: "text.primary",
            }}
          >
            {kudo.description}
          </Typography>

          {kudo.media && kudo.media.length > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap" mb={1.5}>
              {kudo.media.map((m) => (
                <Box
                  key={m.id}
                  onClick={() => m.type === "image" && setLightboxUrl(m.url)}
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: m.type === "image" ? "pointer" : "default",
                    maxWidth: "100%",
                    "&:hover img": { transform: "scale(1.03)" },
                  }}
                >
                  {m.type === "video" ? (
                    <Box
                      component="video"
                      src={m.url}
                      controls
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 300,
                        borderRadius: 2,
                        bgcolor: "#000",
                      }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={m.url}
                      alt="Kudo media"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 300,
                        borderRadius: 2,
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
            {REACTION_ICONS.map((icon) => {
              const count = reactionCounts[icon] || 0;
              const isActive = userReactions.some((r) => r.icon === icon);
              return (
                <Tooltip
                  key={icon}
                  title={isActive ? "Remove reaction" : "Add reaction"}
                >
                  <Chip
                    icon={reactionIconMap[icon] as React.ReactElement}
                    label={count > 0 ? count : undefined}
                    size="small"
                    variant={isActive ? "filled" : "outlined"}
                    onClick={() => handleReact(icon)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: isActive
                        ? `${reactionColors[icon]}20`
                        : undefined,
                      borderColor: isActive ? reactionColors[icon] : "divider",
                      fontWeight: count > 0 ? 600 : 400,
                      transition: "all 0.15s ease",
                      ...(count === 0 && {
                        width: 32,
                        borderRadius: "50%",
                        px: 0,
                      }),
                      "&:hover": {
                        transform: "scale(1.05)",
                        borderColor: reactionColors[icon],
                      },
                      "& .MuiChip-icon": {
                        color: reactionColors[icon],
                        fontSize: 18,
                        margin: 0,
                        ...(count === 0 && {
                          width: "100%",
                          justifyContent: "center",
                          display: "flex",
                        }),
                      },
                      "& .MuiChip-label": {
                        display: count > 0 ? "block" : "none",
                        padding: count > 0 ? "0 8px 0 4px" : 0,
                      },
                    }}
                  />
                </Tooltip>
              );
            })}
            <Tooltip title="More emojis">
              <IconButton
                ref={addReactionRef}
                size="small"
                onClick={(e) => setPickerAnchor(e.currentTarget)}
                sx={{ ml: 0.5 }}
              >
                <AddReaction fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              size="small"
              onClick={() => setShowComments(!showComments)}
              color={showComments ? "primary" : "default"}
              sx={{
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "rgba(99, 102, 241, 0.1)" },
              }}
            >
              <CommentIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
            >
              {kudo._count?.comments || kudo.comments.length}{" "}
              {(kudo._count?.comments || kudo.comments.length) === 1
                ? "comment"
                : "comments"}
            </Typography>
          </Box>
        </CardActions>

        <Collapse in={showComments} timeout={300}>
          <Divider />
          <Box sx={{ px: 2, py: 1.5, bgcolor: "action.hover" }}>
            {kudo.comments.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                py={1}
              >
                No comments yet. Be the first!
              </Typography>
            ) : (
              kudo.comments.map((comment) => (
                <Box key={comment.id} display="flex" gap={1} mb={1.5}>
                  <Avatar sx={{ width: 26, height: 26, fontSize: 12, mt: 0.3 }}>
                    {comment.user.name.charAt(0)}
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor: "background.paper",
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      maxWidth: "85%",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontSize={13}
                      fontWeight={600}
                    >
                      {comment.user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {comment.content}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}

            <Box display="flex" gap={1} alignItems="flex-end" mt={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                multiline
                maxRows={3}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "background.paper",
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                sx={{
                  minWidth: 40,
                  borderRadius: 3,
                  height: 40,
                  width: 40,
                  p: 0,
                }}
              >
                <Send fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Card>

      <Popover
        open={!!pickerAnchor}
        anchorEl={pickerAnchor}
        onClose={() => setPickerAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            maxWidth: 240,
          }}
        >
          {REACTION_ICONS.map((icon) => (
            <Tooltip key={icon} title={icon.replace(/_/g, " ")}>
              <IconButton
                onClick={() => handleReact(icon)}
                sx={{
                  border: 1,
                  borderColor: userReactions.some((r) => r.icon === icon)
                    ? reactionColors[icon]
                    : "divider",
                  borderRadius: 2,
                  color: reactionColors[icon],
                  transition: "all 0.15s ease",
                  "&:hover": {
                    transform: "scale(1.15)",
                    bgcolor: `${reactionColors[icon]}20`,
                  },
                }}
              >
                {reactionIconMap[icon]}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Popover>

      <Dialog
        open={!!lightboxUrl}
        onClose={() => setLightboxUrl(null)}
        maxWidth="lg"
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            bgcolor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            onClick={() => setLightboxUrl(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.5)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          {lightboxUrl && (
            <Box
              component="img"
              src={lightboxUrl}
              alt="Full size"
              sx={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: 2,
                display: "block",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
