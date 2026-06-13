import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UniSchedule Africa',
  description: 'Automated University Timetable Generator for Africa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
