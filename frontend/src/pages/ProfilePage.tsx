import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Fade,
  Grow,
} from "@mui/material";
import {
  EmojiEvents,
  Send,
  CardGiftcard,
  TrendingUp,
} from "@mui/icons-material";
import { rewardApi, kudoApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { PointBalance, Kudo } from "../types";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [recentKudos, setRecentKudos] = useState<Kudo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [balanceRes, kudosRes] = await Promise.all([
          rewardApi.balance(),
          kudoApi.list({ limit: 5 }),
        ]);
        setBalance(balanceRes.data.data || null);
        setRecentKudos(kudosRes.data.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      label: "Available Points",
      value: balance?.balance ?? 0,
      icon: <EmojiEvents sx={{ fontSize: 32 }} />,
      gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
    },
    {
      label: "Points Received",
      value: balance?.received ?? 0,
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
    },
    {
      label: "Points Sent",
      value: balance?.sent ?? 0,
      icon: <Send sx={{ fontSize: 32 }} />,
      gradient: "linear-gradient(135deg, #ec4899, #f472b6)",
    },
    {
      label: "Points Redeemed",
      value: balance?.redeemed ?? 0,
      icon: <CardGiftcard sx={{ fontSize: 32 }} />,
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    },
  ];

  return (
    <Box maxWidth={800} mx="auto">
      <Fade in timeout={500}>
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 88,
                height: 88,
                mx: "auto",
                mb: 2,
                bgcolor: "primary.main",
                fontSize: 36,
                boxShadow: "0px 4px 16px rgba(99, 102, 241, 0.3)",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </CardContent>
        </Card>
      </Fade>

      <Grid container spacing={2} mb={3}>
        {statCards.map((stat, index) => (
          <Grow in timeout={300 + index * 100} key={stat.label}>
            <Grid item xs={6} md={3}>
              <Card
                sx={{
                  borderRadius: 3,
                  textAlign: "center",
                  background: stat.gradient,
                  color: "#fff",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0px 12px 32px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent>
                  <Box mb={1} sx={{ opacity: 0.9 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" fontWeight={800}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grow>
        ))}
      </Grid>

      <Fade in timeout={600}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Recent Kudos
            </Typography>
            {recentKudos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No kudos activity yet. Start sending kudos! 🎉
              </Typography>
            ) : (
              <List>
                {recentKudos.map((kudo, i) => (
                  <Box key={kudo.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {kudo.fromUser.id === user?.id ? "You" : kudo.fromUser.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              →
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {kudo.toUser.id === user?.id ? "You" : kudo.toUser.name}
                            </Typography>
                            <Chip
                              label={`+${kudo.points}`}
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 600, fontSize: 11, height: 22 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 400,
                            }}
                          >
                            {kudo.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
