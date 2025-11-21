export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    email: string;
    role: string;
  }
  
  export interface Vehicle {
    id: number;
    vehicleNumber: string;
    brand: string;
    model: string;
    currentChargePercentage: number;
    maxPayloadKg: number;
    chargingStatus: number; // Changed from string to number
    assignStatus: number;   // Changed from string to number
    assignedToUserId?: number;
    assignedToUserName?: string;
  }
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    userId: number;
    role: string;
    email: string;
    firstName: string;
    lastName: string;
  }