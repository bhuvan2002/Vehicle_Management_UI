import React, { useState, useEffect } from 'react';
import {Container,Card,CardContent,Typography,Box,CircularProgress,Chip,} from '@mui/material';
import {People,DirectionsCar,Assignment,BatteryChargingFull,Person,} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { vehicleService, userService } from '../services/api';
import type { Vehicle } from '../types';

const ASSIGN_STATUS = {
  AVAILABLE: 0,
  ASSIGNED: 1,
  MAINTENANCE: 2,
} as const;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    assignedVehicles: 0,
    availableVehicles: 0,
    totalUsers: 0,
    myAssignedVehicles: 0,
  });
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin()) {
          const [vehicles, users] = await Promise.all([
            vehicleService.getVehicles(),
            userService.getUsers(),
          ]);

          const assignedVehicles = vehicles.filter(v => 
            v.assignedToUserId !== null || v.assignStatus === ASSIGN_STATUS.ASSIGNED
          ).length;
          
          const availableVehicles = vehicles.filter(v => 
            v.assignedToUserId === null
          ).length;

          setStats({
            totalVehicles: vehicles.length,
            assignedVehicles,
            availableVehicles,
            totalUsers: users.length,
            myAssignedVehicles: 0,
          });
        } else {
          const vehicles = await vehicleService.getMyVehicles();
          setMyVehicles(vehicles);
          
          setStats({
            totalVehicles: 0,
            assignedVehicles: 0,
            availableVehicles: 0,
            totalUsers: 0,
            myAssignedVehicles: vehicles.length,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const getStatusText = (status: number): string => {
    switch (status) {
      case ASSIGN_STATUS.AVAILABLE: return 'Available';
      case ASSIGN_STATUS.ASSIGNED: return 'Assigned';
      case ASSIGN_STATUS.MAINTENANCE: return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case ASSIGN_STATUS.AVAILABLE: return 'success';
      case ASSIGN_STATUS.ASSIGNED: return 'primary';
      case ASSIGN_STATUS.MAINTENANCE: return 'warning';
      default: return 'default';
    }
  };

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
        Welcome back, {user?.firstName} {user?.lastName} ({user?.role})
      </Typography>

      {isAdmin() && (
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
            color="#4caf50"
          />
          <StatCard
            icon={<People sx={{ color: 'white' }} />}
            title="Total Users"
            value={stats.totalUsers}
            color="#9c27b0"
          />
        </Box>
      )}

      {!isAdmin() && (
        <>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3, 
            mt: 2,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
            <StatCard
              icon={<Person sx={{ color: 'white' }} />}
              title="My Assigned Vehicles"
              value={stats.myAssignedVehicles}
              color="#1976d2"
            />
          </Box>

          {myVehicles.length > 0 && (
            <Box mt={4}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                My Vehicle Details
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                {myVehicles.map((vehicle) => (
                  <Card key={vehicle.id} elevation={3} sx={{ width: 300 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        {vehicle.vehicleNumber}
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <BatteryChargingFull 
                          sx={{ 
                            mr: 1, 
                            color: vehicle.currentChargePercentage > 50 ? '#4caf50' : 
                                   vehicle.currentChargePercentage > 20 ? '#ff9800' : '#f44336' 
                          }} 
                        />
                        <Typography variant="body2">
                          Charge: {vehicle.currentChargePercentage}%
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Max Payload: {vehicle.maxPayloadKg} kg
                      </Typography>
                      <Chip 
                        label={getStatusText(vehicle.assignStatus)} 
                        color={getStatusColor(vehicle.assignStatus)}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {myVehicles.length === 0 && (
            <Box textAlign="center" mt={4}>
              <Typography variant="h6" color="text.secondary">
                You don't have any vehicles assigned to you yet.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Dashboard;