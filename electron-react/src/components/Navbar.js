import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/api';

function Navbar({ isAuthenticated, user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onLogout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            PhotoMaster
          </Link>
        </Typography>
        
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.name}
            </Typography>
            <Avatar sx={{ mr: 2 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;