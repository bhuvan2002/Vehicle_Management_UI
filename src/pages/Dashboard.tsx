import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  People,
  DirectionsCar,
  Assignment,
  BatteryChargingFull,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { vehicleService, userService } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    assignedVehicles: 0,
    availableVehicles: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehicles, users] = await Promise.all([
          vehicleService.getVehicles(),
          isAdmin() ? userService.getUsers() : Promise.resolve([]),
        ]);

        const assignedVehicles = vehicles.filter(v => v.assignStatus === 'Assigned').length;
        const availableVehicles = vehicles.filter(v => v.assignStatus === 'Available').length;

        setStats({
          totalVehicles: vehicles.length,
          assignedVehicles,
          availableVehicles,
          totalUsers: users.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ icon, title, value, color }: any) => (
    <Card elevation={3} sx={{ height: '100%', minWidth: '200px', flex: '1 1 200px' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Welcome back, {user?.firstName} {user?.lastName}
      </Typography>

      {/* Using Flexbox instead of Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3, 
        mt: 2,
        justifyContent: { xs: 'center', sm: 'flex-start' }
      }}>
        <StatCard
          icon={<DirectionsCar sx={{ color: 'white' }} />}
          title="Total Vehicles"
          value={stats.totalVehicles}
          color="#1976d2"
        />
        <StatCard
          icon={<Assignment sx={{ color: 'white' }} />}
          title="Assigned Vehicles"
          value={stats.assignedVehicles}
          color="#2e7d32"
        />
        <StatCard
          icon={<BatteryChargingFull sx={{ color: 'white' }} />}
          title="Available Vehicles"
          value={stats.availableVehicles}
          color="#ed6c02"
        />
        {isAdmin() && (
          <StatCard
            icon={<People sx={{ color: 'white' }} />}
            title="Total Users"
            value={stats.totalUsers}
            color="#9c27b0"
          />
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;