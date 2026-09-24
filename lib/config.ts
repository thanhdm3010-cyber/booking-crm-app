export const config = {
  hostName: process.env.HOST_NAME || "Đỗ Mạnh Thành",
  hostEmail: process.env.HOST_EMAIL || "host@example.com",
  hostSlug: process.env.HOST_SLUG || "manhthanh",
  timezone: process.env.HOST_TIMEZONE || "Asia/Bangkok",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  durationMinutes: 45,
  bufferMinutes: 15,
  workingHours: {
    start: 9,
    end: 17
  }
};
