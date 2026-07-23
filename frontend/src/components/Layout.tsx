import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import {
  Feed as FeedIcon,
  AddCircle,
  CardGiftcard,
  Person,
  Logout,
  Notifications,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../store/authStore";
import { notificationApi } from "../services/api";
import { getSocket } from "../services/socket";
import type { Notification } from "../types";

const DRAWER_WIDTH = 240;

const navItems = [
  { path: "/", label: "Feed", icon: <FeedIcon /> },
  { path: "/send", label: "Send Kudo", icon: <AddCircle /> },
  { path: "/rewards", label: "Rewards", icon: <CardGiftcard /> },
  { path: "/profile", label: "Profile", icon: <Person /> },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.list({ limit: 5 });
      const data = res.data.data;
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotif = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 5));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNotif);
    return () => {
      socket.off("notification:new", handleNotif);
    };
  }, []);

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login");
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Divider sx={{ mx: 2 }} />
      <List sx={{ mt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileDrawerOpen(false);
                }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 1.2,
                  "&.Mui-selected": {
                    bgcolor: "rgba(99, 102, 241, 0.1)",
                    "&:hover": { bgcolor: "rgba(99, 102, 241, 0.15)" },
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                    "& .MuiListItemText-primary": { color: "primary.main", fontWeight: 700 },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? "primary.main" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ px: 2, pb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ px: 1.5, py: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              background: "linear-gradient(135deg, #6366f1, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            👏 Good Job!
          </Typography>

          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34, fontSize: 15 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: { mt: 1, borderRadius: 2, minWidth: 180, boxShadow: "0px 8px 24px rgba(0,0,0,0.1)" },
            }}
          >
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/profile"); }}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={() => setNotifAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{
              sx: { mt: 1, borderRadius: 2, minWidth: 320, maxWidth: 360, boxShadow: "0px 8px 24px rgba(0,0,0,0.1)" },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
              {unreadCount > 0 && (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: "pointer", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </Typography>
              )}
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
              </Box>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <MenuItem key={notif.id} sx={{ py: 1.5, bgcolor: notif.read ? "transparent" : "rgba(99,102,241,0.04)" }}>
                  <Box>
                    <Typography variant="body2" fontWeight={notif.read ? 400 : 600}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      )}

      {isMobile && (
        <SwipeableDrawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          onOpen={() => setMobileDrawerOpen(true)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 280,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          maxWidth: { md: 900 },
          mx: { md: "auto" },
          width: "100%",
          minHeight: "100vh",
          pb: { xs: 10, md: 3 },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {isMobile && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.appBar,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
          elevation={4}
        >
          <BottomNavigation
            value={navItems.findIndex((item) => item.path === location.pathname)}
            onChange={(_, index) => navigate(navItems[index].path)}
            sx={{ bgcolor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                icon={item.icon}
                label={item.label}
                sx={{
                  "&.Mui-selected": {
                    color: "primary.main",
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: 11,
                      fontWeight: 700,
                    },
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
