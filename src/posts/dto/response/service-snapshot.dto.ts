import { Expose } from "class-transformer";

export class ServiceSnapshotDto {
    @Expose()
    id: number;

    @Expose()
    bookings?: any[];
  
    @Expose()
    serviceType: string;
  
    @Expose()
    price: number;
  
    @Expose()
    unavailableDates: string[];
  }