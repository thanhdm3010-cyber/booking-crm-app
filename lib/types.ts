export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type CrmStage = "new" | "booked" | "attended" | "follow_up" | "interested" | "customer" | "lost";

export type Booking = {
  id: string;
  manageToken: string;
  hostSlug: string;
  hostName: string;
  hostEmail: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  note?: string;
  surveyData?: Record<string, unknown>;
  source?: string;
  campaign?: string;
  start: string;
  end: string;
  timezone: string;
  status: BookingStatus;
  crmStage: CrmStage;
  meetUrl?: string | null;
  calendarEventId?: string | null;
  reminder24hSentAt?: string | null;
  reminder1hSentAt?: string | null;
  followUpSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
