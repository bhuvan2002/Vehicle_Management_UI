import React, { useState, useEffect } from 'react';
import {Container,Paper,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Button,IconButton,Chip,Box,Typography,Alert,CircularProgress,Dialog,DialogTitle,DialogContent,DialogActions,
  TextField,MenuItem,Snackbar,Card,CardContent,Avatar,List,ListItem,ListItemAvatar,ListItemText,} from '@mui/material';
import { Edit,  Delete,  Add,  BatteryChargingFull,  Person,  Assignment, CheckCircle, Cancel, DirectionsCar} from '@mui/icons-material';
import { vehicleService, userService } from '../services/api';
import type { Vehicle, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface VehicleFormData {
  vehicleNumber: string;
  brand: string;
  model: string;
  currentChargePercentage: number;
  maxPayloadKg: number;
}

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
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openUnassignDialog, setOpenUnassignDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    vehicleNumber: '',
    brand: '',
    model: '',
    currentChargePercentage: 0,
    maxPayloadKg: 0,
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

      console.log('Vehicles data:', data);
      console.log('Assign Status values:', data.map((v: Vehicle) => ({
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        assignStatus: v.assignStatus,
        assignStatusType: typeof v.assignStatus,
        assignedToUserId: v.assignedToUserId,
        assignedToUserName: v.assignedToUserName
      })));
      
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
      // Filter out admin users, show only regular users for assignment
      const regularUsers = data.filter(user => user.role === 'user');
      setUsers(regularUsers);
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };


  const calculateStatistics = () => {
    const totalVehicles = vehicles.length;
    
    const assignedVehicles = vehicles.filter(v => {
      return v.assignedToUserId !== null || v.assignStatus === ASSIGN_STATUS.Assigned;
    }).length;

    const availableVehicles = vehicles.filter(v => {
      return v.assignedToUserId === null;
    }).length;

    console.log('Statistics Calculation:', {
      total: totalVehicles,
      assigned: assignedVehicles,
      available: availableVehicles,
      vehicles: vehicles.map(v => ({
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        assignStatus: v.assignStatus,
        assignedToUserId: v.assignedToUserId,
        assignedToUserName: v.assignedToUserName
      }))
    });

    return { totalVehicles, assignedVehicles, availableVehicles };
  };

  const { totalVehicles, assignedVehicles, availableVehicles } = calculateStatistics();

  const getStatusColor = (vehicle: Vehicle) => {
    const status = typeof vehicle.assignStatus === 'string' 
      ? parseInt(vehicle.assignStatus) 
      : vehicle.assignStatus;
    

    if (vehicle.assignedToUserId) {
      return 'primary';
    }
    
    if (status === ASSIGN_STATUS.Assigned) {
      return 'primary';
    }
    if (status === ASSIGN_STATUS.Available) {
      return 'success';
    }
    if (status === ASSIGN_STATUS.Maintenance) {
      return 'warning';
    }
    return 'default';
  };

  const getAssignStatusText = (vehicle: Vehicle): string => {
    const status = typeof vehicle.assignStatus === 'string' 
      ? parseInt(vehicle.assignStatus) 
      : vehicle.assignStatus;

    if (vehicle.assignedToUserId) {
      return 'Assigned';
    }
    
    // Otherwise use the status from enum
    return ASSIGN_STATUS_LABELS[status] || 'Unknown';
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({
      vehicleNumber: '',
      brand: '',
      model: '',
      currentChargePercentage: 0,
      maxPayloadKg: 0,
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
    });
    setOpenDialog(true);
  };

  const handleOpenAssign = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedUserId('');
    setOpenAssignDialog(true);
  };

  const handleOpenUnassign = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenUnassignDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedVehicle(null);
    setSelectedUserId('');
  };

  const handleCloseUnassignDialog = () => {
    setOpenUnassignDialog(false);
    setSelectedVehicle(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'currentChargePercentage' || name === 'maxPayloadKg' 
        ? Number(value) 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle.id, {
          vehicleNumber: formData.vehicleNumber,
          brand: formData.brand,
          model: formData.model,
          currentChargePercentage: formData.currentChargePercentage,
          maxPayloadKg: formData.maxPayloadKg,
        });
        setSuccess('Vehicle updated successfully!');
      } else {
        const payload = {
          vehicleNumber: formData.vehicleNumber,
          brand: formData.brand,
          model: formData.model,
          currentChargePercentage: formData.currentChargePercentage,
          maxPayloadKg: formData.maxPayloadKg,
        };
        
        await vehicleService.createVehicle(payload);
        setSuccess('Vehicle created successfully!');
      }
      
      handleCloseDialog();
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const handleAssignVehicle = async () => {
    if (!selectedVehicle || !selectedUserId) {
      setError('Please select a user to assign the vehicle');
      return;
    }

    setError('');
    setSuccess('');

    try {
      console.log(`Assigning vehicle ${selectedVehicle.id} to user ${selectedUserId}`);
      await vehicleService.assignVehicle(selectedVehicle.id, selectedUserId);
      setSuccess(`Vehicle ${selectedVehicle.vehicleNumber} assigned successfully!`);
      handleCloseAssignDialog();
    
      setTimeout(() => {
        fetchVehicles();
      }, 500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign vehicle');
    }
  };

  const handleUnassignVehicle = async () => {
    if (!selectedVehicle || !selectedVehicle.assignedToUserId) {
      setError('No user assigned to this vehicle');
      return;
    }

    setError('');
    setSuccess('');

    try {
      console.log(`Unassigning vehicle ${selectedVehicle.id} from user ${selectedVehicle.assignedToUserId}`);
      await vehicleService.unassignVehicle(selectedVehicle.id, selectedVehicle.assignedToUserId);
      setSuccess(`Vehicle ${selectedVehicle.vehicleNumber} unassigned successfully!`);
      handleCloseUnassignDialog();
      setTimeout(() => {
        fetchVehicles();
      }, 500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unassign vehicle');
    }
  };

  const handleDelete = async (vehicleId: number) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.deleteVehicle(vehicleId);
      setSuccess('Vehicle deleted successfully!');
      fetchVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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

      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                <DirectionsCar />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Vehicles
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {totalVehicles}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                <Assignment />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Assigned Vehicles
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {assignedVehicles}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {assignedVehicles === 1 ? '1 vehicle' : `${assignedVehicles} vehicles`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Available Vehicles
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {availableVehicles}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {availableVehicles === 1 ? '1 vehicle' : `${availableVehicles} vehicles`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vehicle Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Brand & Model</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Charge Level</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Max Payload</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assign Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Assigned To</TableCell>
              {isAdmin() && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow 
                key={vehicle.id}
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
                  backgroundColor: vehicle.assignStatus === ASSIGN_STATUS.Assigned || vehicle.assignedToUserId ? 'action.selected' : 'inherit'
                }}
              >
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {vehicle.vehicleNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {vehicle.brand}
                  </Typography>
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
                               vehicle.currentChargePercentage > 20 ? '#ff9800' : '#f44336',
                        fontSize: 20
                      }} 
                    />
                    <Box>
                      <Typography fontWeight="medium">
                        {vehicle.currentChargePercentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Charge
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography fontWeight="medium">
                    {vehicle.maxPayloadKg} kg
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getAssignStatusText(vehicle)} 
                    color={getStatusColor(vehicle) as any}
                    size="small"
                    icon={
                      vehicle.assignStatus === ASSIGN_STATUS.Assigned || vehicle.assignedToUserId ? 
                        <CheckCircle /> : undefined
                    }
                  />
                  <Typography variant="caption" display="block" color="text.secondary">
                    Status Code: {vehicle.assignStatus}
                    {vehicle.assignedToUserId && ` (User: ${vehicle.assignedToUserId})`}
                  </Typography>
                </TableCell>
                <TableCell>
                  {vehicle.assignedToUserName ? (
                    <Box 
                      display="flex" 
                      alignItems="center"
                      onClick={() => isAdmin() && handleOpenUnassign(vehicle)}
                      sx={{ 
                        cursor: isAdmin() ? 'pointer' : 'default',
                        '&:hover': isAdmin() ? { backgroundColor: 'action.hover', borderRadius: 1, p: 0.5 } : {}
                      }}
                    >
                      <Person sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.assignedToUserName}
                      </Typography>
                      {isAdmin() && (
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                          (Click to unassign)
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box
                      onClick={() => isAdmin() && handleOpenAssign(vehicle)}
                      sx={{ 
                        cursor: isAdmin() ? 'pointer' : 'default',
                        '&:hover': isAdmin() ? { backgroundColor: 'action.hover', borderRadius: 1, p: 0.5 } : {}
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        fontStyle="italic"
                        sx={{ textDecoration: isAdmin() ? 'underline' : 'none' }}
                      >
                        {isAdmin() ? 'Click to Assign User' : 'Not Assigned'}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                {isAdmin() && (
                  <TableCell>
                    <Box display="flex" gap={1} alignItems="center">
                      <IconButton 
                        color="primary" 
                        size="small" 
                        onClick={() => handleOpenEdit(vehicle)}
                        title="Edit Vehicle"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        size="small" 
                        onClick={() => handleDelete(vehicle.id)}
                        title="Delete Vehicle"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Vehicle Number"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
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
                variant="outlined"
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
                variant="outlined"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="large">
              {editingVehicle ? 'Update' : 'Create'} Vehicle
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Assign Vehicle to User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedVehicle && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vehicle Details
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedVehicle.vehicleNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </Typography>
                  <Typography variant="body2">
                    Charge: {selectedVehicle.currentChargePercentage}%
                  </Typography>
                  <Typography variant="body2">
                    Payload: {selectedVehicle.maxPayloadKg} kg
                  </Typography>
                  <Typography variant="body2">
                    Current Status: {getAssignStatusText(selectedVehicle)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Select User to Assign
          </Typography>
          
          <TextField
            select
            label="Choose User"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            fullWidth
            variant="outlined"
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="">
              <em>Select a user</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.userId} value={user.userId}>
                {user.firstName} {user.lastName} ({user.email})
              </MenuItem>
            ))}
          </TextField>

          {usersLoading && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {selectedUserId && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected User:
              </Typography>
              <List dense>
                {users
                  .filter(user => user.userId === selectedUserId)
                  .map(user => (
                    <ListItem key={user.userId}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${user.firstName} ${user.lastName}`}
                        secondary={user.email}
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAssignDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleAssignVehicle} 
            variant="contained" 
            size="large"
            disabled={!selectedUserId}
            startIcon={<Assignment />}
          >
            Assign Vehicle
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openUnassignDialog} onClose={handleCloseUnassignDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Unassign Vehicle
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedVehicle && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Confirm Unassignment
              </Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedVehicle.vehicleNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </Typography>
                  <Typography variant="body2">
                    Currently assigned to: <strong>{selectedVehicle.assignedToUserName}</strong>
                  </Typography>
                </CardContent>
              </Card>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to unassign this vehicle from {selectedVehicle.assignedToUserName}?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseUnassignDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleUnassignVehicle} 
            variant="contained" 
            color="secondary"
            size="large"
            startIcon={<Cancel />}
          >
            Unassign Vehicle
          </Button>
        </DialogActions>
      </Dialog>

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