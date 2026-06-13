import { NextResponse } from 'next/server';

export default function Home() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#0f2a1a' }}>UniSchedule Africa API</h1>
      <p style={{ color: '#5c6878', marginTop: 8 }}>Backend is running. Available endpoints:</p>
      <ul style={{ marginTop: 16, lineHeight: 2.2, color: '#2d7a4a' }}>
        <li><code>POST /api/v1/auth/login</code></li>
        <li><code>POST /api/v1/auth/register</code></li>
        <li><code>POST /api/v1/auth/refresh</code></li>
        <li><code>GET/POST /api/v1/sessions</code></li>
        <li><code>GET/POST /api/v1/groups</code></li>
        <li><code>GET/POST /api/v1/lecturers</code></li>
        <li><code>GET/POST /api/v1/rooms</code></li>
        <li><code>GET/POST /api/v1/courses</code></li>
        <li><code>GET/POST /api/v1/exams</code></li>
        <li><code>GET/POST /api/v1/timetables</code></li>
        <li><code>POST /api/v1/notifications/send</code></li>
      </ul>
      <p style={{ marginTop: 24, color: '#9daab8', fontSize: 13 }}>
        See <code>UniSchedule_Africa_DB_API_Design.docx</code> for full documentation.
      </p>
    </main>
  );
}
