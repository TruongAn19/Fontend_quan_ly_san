import { PitchType } from './product.model';

export interface DashboardTopProduct {
  name: string;
  bookingCount: number;
  revenue: number;
}

export interface DashboardRecentBooking {
  id: number;
  totalPrice: number;
}

export interface DashboardStats {
  countUser: number;
  countProduct: number;
  countByEquipment: number;
  countBookingToday: number;
  monthlyRevenue: number;
  topProducts: DashboardTopProduct[];
  recentBookings: DashboardRecentBooking[];
}

export interface TopEquipmentDTO {
  id: number;
  name: string | null;
  price: number;
  factory: string | null;
  image: string | null;
  rentalStock: number;
  rentCount: number;
  revenue: number;
}

export interface EquipmentStatistics {
  listProduct: StatisticsProduct[];
  totalEquipments: number;
  currentlyRented: number;
  monthlyRentals: number;
  monthlyRevenue: number;
  topEquipments: TopEquipmentDTO[];
  rentalsByMonth: Record<string, number>;
  revenueByMonth: Record<string, number>;
}

export interface StatisticsProduct {
  id: number;
  name: string | null;
  price: number;
  image: string | null;
  detailDesc: string | null;
  shortDesc: string | null;
  quantity: number;
  sale: number;
  address: string | null;
  addressDetail: string | null;
  status: string | null;
  subPitchNames: string | null;
  pitchType: PitchType;
  user: Record<string, unknown> | null;
  availableTimes: Array<{ id: number; time: string }>;
  equipments: unknown[];
}

export type RevenueByDate = Record<string, number>;

export interface RevenueChartPoint {
  date: string;
  label: string;
  value: number;
  isToday: boolean;
}
