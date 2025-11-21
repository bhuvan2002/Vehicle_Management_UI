import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
} from '@mui/material';
import { Edit, Delete, Add, BatteryChargingFull } from '@mui/icons-material';
import { vehicleService, userService } from '../services/api';
import type { Vehicle, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface VehicleFormData {
  vehicleNumber: string;
  brand: string;
  model: string;
  currentChargePercentage: number;
  maxPayloadKg: number;
  chargingStatus: number;
}

// Charging Status Enum (matching your backend)
const CHARGING_STATUS = {
  Charging: 0,
  FullyCharged: 1,
  NotCharging: 2,
  Faulty: 3,
};

// Reverse mapping for display
const CHARGING_STATUS_LABELS: { [key: number]: string } = {
  0: 'Charging',
  1: 'Fully Charged',
  2: 'Not Charging',
  3: 'Faulty',
};

// Assign Status Enum (matching your backend)
const ASSIGN_STATUS = {
  Available: 0,
  Assigned: 1,
  Maintenance: 2,
};

const ASSIGN_STATUS_LABELS: { [key: number]: string } = {
  0: 'Available',
  1: 'Assigned',
  2: 'Maintenance',
};

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    vehicleNumber: '',
    brand: '',
    model: '',
    currentChargePercentage: 0,
    maxPayloadKg: 0,
    chargingStatus: CHARGING_STATUS.NotCharging,
  });

  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchVehicles();
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (error) {
      setError('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicleNumber: '',
      brand: '',
      model: '',
      currentChargePercentage: 0,
      maxPayloadKg: 0,
      chargingStatus: CHARGING_STATUS.NotCharging,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      currentChargePercentage: vehicle.currentChargePercentage,
      maxPayloadKg: vehicle.maxPayloadKg,
      chargingStatus: vehicle.chargingStatus as number,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'currentChargePercentage' || name === 'maxPayloadKg' || name === 'chargingStatus' 
        ? Number(value) 
        : value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingVehicle) {
        // Update existing vehicle
        await vehicleService.updateVehicle(editingVehicle.id, {
          vehicleNumber: formData.vehicleNumber,
          brand: formData.brand,
          model: formData.model,
          currentChargePercentage: formData.currentChargePercentage,
          maxPayloadKg: formData.maxPayloadKg,
          chargingStatus: formData.chargingStatus,
        });
        setSuccess('Vehicle updated successfully!');
      } else {
        // Create new vehicle - using the exact payload structure you specified
        const payload = {
          vehicleNumber: formData.vehicleNumber,
          brand: formData.brand,
          model: formData.model,
          currentChargePercentage: formData.currentChargePercentage,
          maxPayloadKg: formData.maxPayloadKg,
          chargingStatus: formData.chargingStatus,
        };
        
        await vehicleService.createVehicle(payload);
        setSuccess('Vehicle created successfully!');
      }
      
      handleCloseDialog();
      fetchVehicles(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (vehicleId: number) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.deleteVehicle(vehicleId);
      setSuccess('Vehicle deleted successfully!');
      fetchVehicles(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Assigned': return 'primary';
      case 'Maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getChargingColor = (status: string) => {
    switch (status) {
      case 'Fully Charged': return 'success';
      case 'Charging': return 'warning';
      case 'Not Charging': return 'default';
      case 'Faulty': return 'error';
      default: return 'default';
    }
  };

  // Helper function to get display text for enums
  const getChargingStatusText = (status: number): string => {
    return CHARGING_STATUS_LABELS[status] || 'Unknown';
  };

  const getAssignStatusText = (status: number): string => {
    return ASSIGN_STATUS_LABELS[status] || 'Unknown';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Vehicle Management
        </Typography>
        {isAdmin() && (
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
            Add Vehicle
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Vehicle Number</strong></TableCell>
              <TableCell><strong>Brand & Model</strong></TableCell>
              <TableCell><strong>Charge Level</strong></TableCell>
              <TableCell><strong>Max Payload</strong></TableCell>
              <TableCell><strong>Charging Status</strong></TableCell>
              <TableCell><strong>Assign Status</strong></TableCell>
              <TableCell><strong>Assigned To</strong></TableCell>
              {isAdmin() && <TableCell><strong>Actions</strong></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {vehicle.vehicleNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{vehicle.brand}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.model}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <BatteryChargingFull 
                      sx={{ 
                        mr: 1, 
                        color: vehicle.currentChargePercentage > 50 ? '#4caf50' : 
                               vehicle.currentChargePercentage > 20 ? '#ff9800' : '#f44336' 
                      }} 
                    />
                    <Typography>
                      {vehicle.currentChargePercentage}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{vehicle.maxPayloadKg} kg</TableCell>
                <TableCell>
                  <Chip 
                    label={getChargingStatusText(vehicle.chargingStatus as number)} 
                    color={getChargingColor(getChargingStatusText(vehicle.chargingStatus as number)) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getAssignStatusText(vehicle.assignStatus as number)} 
                    color={getStatusColor(getAssignStatusText(vehicle.assignStatus as number)) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {vehicle.assignedToUserName || 'Not Assigned'}
                </TableCell>
                {isAdmin() && (
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      size="small" 
                      onClick={() => handleOpenEdit(vehicle)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Vehicle Number"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Current Charge Percentage"
                name="currentChargePercentage"
                type="number"
                value={formData.currentChargePercentage}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                required
                fullWidth
              />
              <TextField
                label="Max Payload (kg)"
                name="maxPayloadKg"
                type="number"
                value={formData.maxPayloadKg}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 0.1 }}
                required
                fullWidth
              />
              <TextField
                select
                label="Charging Status"
                name="chargingStatus"
                value={formData.chargingStatus}
                onChange={handleSelectChange}
                required
                fullWidth
              >
                <MenuItem value={CHARGING_STATUS.Charging}>Charging</MenuItem>
                <MenuItem value={CHARGING_STATUS.FullyCharged}>Fully Charged</MenuItem>
                <MenuItem value={CHARGING_STATUS.NotCharging}>Not Charging</MenuItem>
                <MenuItem value={CHARGING_STATUS.Faulty}>Faulty</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingVehicle ? 'Update' : 'Create'} Vehicle
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Container>
  );
};

export default Vehicles;