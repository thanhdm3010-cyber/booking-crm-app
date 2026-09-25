export const config = {
  hostName: process.env.HOST_NAME || "Đỗ Mạnh Thành",
  hostEmail: process.env.HOST_EMAIL || "thanhdm3010@gmail.com",
  hostSlug: process.env.HOST_SLUG || "manhthanh",
  timezone: process.env.HOST_TIMEZONE || "Asia/Bangkok",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  zoomUrl: process.env.ZOOM_MEETING_URL || "https://zoom.us/j/91828980928?pwd=ajubFLRIlmsUyMwQqiEJ4jNqVnliLL.1",
  zoomMeetingId: process.env.ZOOM_MEETING_ID || "918 2898 0928",
  zoomPasscode: process.env.ZOOM_PASSCODE || "629612",
  durationMinutes: 45,
  bufferMinutes: 15,
  workingHours: {
    start: 9,
    end: 17
  }
};
