import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Skeleton,
  Fade,
} from "@mui/material";
import { Refresh, EmojiEmotions } from "@mui/icons-material";
import { feedApi, kudoApi } from "../services/api";
import { getSocket } from "../services/socket";
import KudoCard from "../components/KudoCard";
import type { Kudo } from "../types";

function SkeletonCard() {
  return (
    <Box sx={{ borderRadius: 3, mb: 2, p: 2, bgcolor: "background.paper" }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Skeleton variant="circular" width={30} height={30} />
        <Skeleton variant="text" width={80} />
        <Skeleton variant="text" width={20} />
        <Skeleton variant="circular" width={30} height={30} />
        <Skeleton variant="text" width={80} />
      </Box>
      <Box display="flex" gap={1} mb={2}>
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </Box>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Box display="flex" gap={0.5} mt={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} variant="rounded" width={50} height={28} />
        ))}
      </Box>
    </Box>
  );
}

export default function FeedPage() {
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchKudos = useCallback(async (pageNum: number, append = false) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: 10 };
      if (tab === 1) params.type = "sent";
      if (tab === 2) params.type = "received";

      const res = tab === 0
        ? await feedApi.get(params)
        : await kudoApi.list(params);
      const newKudos = res.data.data || [];
      if (append) {
        setKudos((prev) => [...prev, ...newKudos]);
      } else {
        setKudos(newKudos);
      }
      const pagination = res.data.pagination;
      if (pagination) {
        setHasMore(pageNum < pagination.totalPages);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setKudos([]);
    setPage(1);
    setHasMore(true);
    fetchKudos(1);
  }, [fetchKudos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchKudos(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchKudos]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewKudo = (kudo: Kudo) => {
      setKudos((prev) => [kudo, ...prev]);
    };

    socket.on("kudo:new", handleNewKudo);
    return () => {
      socket.off("kudo:new", handleNewKudo);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchKudos(1);
  };

  const handleReactionUpdate = (kudoId: string, reactions: Kudo["reactions"]) => {
    setKudos((prev) =>
      prev.map((k) => (k.id === kudoId ? { ...k, reactions } : k))
    );
  };

  const handleCommentUpdate = (kudoId: string, comments: Kudo["comments"]) => {
    setKudos((prev) =>
      prev.map((k) => (k.id === kudoId ? { ...k, comments } : k))
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Feed
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="All" />
        <Tab label="Sent" />
        <Tab label="Received" />
      </Tabs>

      {loading && kudos.length === 0 ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </Box>
      ) : kudos.length === 0 ? (
        <Fade in timeout={500}>
          <Box textAlign="center" py={6}>
            <EmojiEmotions sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No kudos yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Be the first to send a kudo! 🎉
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.href = "/send"}
              sx={{ borderRadius: 2 }}
            >
              Send a Kudo
            </Button>
          </Box>
        </Fade>
      ) : (
        <>
          {kudos.map((kudo, index) => (
            <Fade in timeout={300 + index * 50} key={kudo.id}>
              <Box>
                <KudoCard
                  kudo={kudo}
                  onReactionUpdate={handleReactionUpdate}
                  onCommentUpdate={handleCommentUpdate}
                />
              </Box>
            </Fade>
          ))}
          <div ref={loaderRef} style={{ height: 20 }} />
          {loading && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!hasMore && kudos.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              py={2}
            >
              You've seen all kudos ✨
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
