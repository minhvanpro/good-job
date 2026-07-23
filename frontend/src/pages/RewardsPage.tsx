import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  LinearProgress,
  Fade,
  Grow,
} from "@mui/material";
import { CardGiftcard, Redeem, History, EmojiEvents } from "@mui/icons-material";
import { rewardApi } from "../services/api";
import type { Reward, Redemption, PointBalance } from "../types";

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, balanceRes, redemptionsRes] = await Promise.all([
        rewardApi.catalog(),
        rewardApi.balance(),
        rewardApi.redemptions({ limit: 20 }),
      ]);
      setRewards(catalogRes.data.data || []);
      setBalance(balanceRes.data.data || null);
      setRedemptions(redemptionsRes.data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async () => {
    if (!selectedReward) return;
    setRedeeming(true);
    setError(null);
    setSuccess(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      await rewardApi.redeem(selectedReward.id, idempotencyKey);
      setSuccess(`Successfully redeemed "${selectedReward.name}"! 🎉`);
      setSelectedReward(null);
      fetchData(); // Refresh balance and redemptions
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to redeem reward";
      setError(message);
    } finally {
      setRedeeming(false);
    }
  };

  const nextReward = rewards
    .filter((r) => balance && balance.balance < r.costPoints)
    .sort((a, b) => a.costPoints - b.costPoints)[0];

  const progressPercent = balance && nextReward
    ? Math.min((balance.balance / nextReward.costPoints) * 100, 100)
    : 100;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Rewards 🎁
        </Typography>
        {balance && (
          <Chip
            icon={<EmojiEvents />}
            label={`${balance.balance} pts`}
            color="primary"
            sx={{ fontWeight: 700, fontSize: 14, py: 2.5, px: 1 }}
          />
        )}
      </Box>

      {balance && nextReward && (
        <Fade in timeout={500}>
          <Card sx={{ borderRadius: 3, mb: 3, bgcolor: "rgba(99, 102, 241, 0.04)" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" fontWeight={600}>
                  Next reward: {nextReward.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {balance.balance} / {nextReward.costPoints} pts
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background: "linear-gradient(90deg, #6366f1, #818cf8)",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Fade>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<CardGiftcard />} label="Catalog" iconPosition="start" />
        <Tab icon={<History />} label="History" iconPosition="start" />
      </Tabs>

      {tab === 0 ? (
        rewards.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No rewards available yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {rewards.map((reward, index) => (
              <Grow in timeout={300 + index * 100} key={reward.id}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0px 12px 32px rgba(0,0,0,0.1)",
                      },
                      position: "relative",
                      overflow: "visible",
                    }}
                  >
                    {reward.imageUrl && (
                      <Box
                        component="img"
                        src={reward.imageUrl}
                        alt={reward.name}
                        sx={{
                          width: "100%",
                          height: 160,
                          objectFit: "cover",
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {reward.name}
                      </Typography>
                      {reward.description && (
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {reward.description}
                        </Typography>
                      )}
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Chip
                          label={`${reward.costPoints} pts`}
                          color={balance && balance.balance >= reward.costPoints ? "primary" : "default"}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {reward.stock !== null && (
                          <Typography variant="caption" color="text.secondary">
                            Stock: {reward.stock}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Redeem />}
                        onClick={() => setSelectedReward(reward)}
                        disabled={
                          !balance ||
                          balance.balance < reward.costPoints ||
                          (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0)
                        }
                        sx={{ borderRadius: 2, textTransform: "none" }}
                      >
                        {!balance || balance.balance < reward.costPoints
                          ? "Not enough points"
                          : reward.stock !== null && reward.stock !== undefined && reward.stock <= 0
                          ? "Out of stock"
                          : "Redeem"}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grow>
            ))}
          </Grid>
        )
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <List>
            {redemptions.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No redemptions yet"
                  secondary="Start redeeming your points for rewards!"
                />
              </ListItem>
            ) : (
              redemptions.map((r, i) => (
                <Box key={r.id}>
                  {i > 0 && <Divider component="li" />}
                  <ListItem>
                    <ListItemText
                      primary={r.reward.name}
                      secondary={`${new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })} • ${r.status}`}
                    />
                    <Chip
                      label={`-${r.pointsSpent} pts`}
                      color="secondary"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </ListItem>
                </Box>
              ))
            )}
          </List>
        </Card>
      )}

      <Dialog
        open={!!selectedReward}
        onClose={() => !redeeming && setSelectedReward(null)}
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Redemption</DialogTitle>
        <DialogContent>
          {selectedReward && (
            <Box>
              {selectedReward.imageUrl && (
                <Box
                  component="img"
                  src={selectedReward.imageUrl}
                  alt={selectedReward.name}
                  sx={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 2,
                    mb: 2,
                  }}
                />
              )}
              <Typography variant="h6" gutterBottom fontWeight={600}>
                {selectedReward.name}
              </Typography>
              {selectedReward.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedReward.description}
                </Typography>
              )}
              <Box display="flex" alignItems="center" gap={1} mt={2}>
                <Chip
                  label={`Cost: ${selectedReward.costPoints} pts`}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                {balance && (
                  <Chip
                    label={`Your balance: ${balance.balance} pts`}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              {balance && balance.balance < selectedReward.costPoints && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You don't have enough points to redeem this reward.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSelectedReward(null)}
            disabled={redeeming}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRedeem}
            disabled={
              redeeming ||
              !balance ||
              !selectedReward ||
              balance.balance < selectedReward.costPoints
            }
            startIcon={redeeming ? <CircularProgress size={20} /> : <Redeem />}
            sx={{ borderRadius: 2 }}
          >
            {redeeming ? "Redeeming..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
