import React, { useState, useEffect } from 'react';
import {Container,Card,CardContent,Typography,Box,Chip,CircularProgress,Alert,} from '@mui/material';
import { BatteryChargingFull, LocalShipping } from '@mui/icons-material';
import { vehicleService } from '../services/api';
import type { Vehicle } from '../types';

const MyVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const fetchMyVehicles = async () => {
    try {
      const data = await vehicleService.getMyVehicles();
      setVehicles(data);
    } catch (error) {
      setError('Failed to fetch your vehicles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        My Assigned Vehicles
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {vehicles.length === 0 ? (
        <Box textAlign="center" py={8}>
          <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No vehicles assigned to you
          </Typography>
        </Box>
      ) : (
        // Using Flexbox instead of Grid
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3,
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}>
          {vehicles.map((vehicle) => (
            <Box key={vehicle.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      {vehicle.vehicleNumber}
                    </Typography>
                    <Chip 
                      label={vehicle.assignStatus} 
                      color="primary"
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body1" color="text.primary" gutterBottom>
                    {vehicle.brand} {vehicle.model}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
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
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Max Payload: {vehicle.maxPayloadKg} kg
                  </Typography>
                
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default MyVehicles;