// Africa's Talking SMS integration
// Docs: https://developers.africastalking.com/docs/sms/sending

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SendSMSOptions {
  to: string | string[];   // Phone numbers with country code e.g. +237677001234
  message: string;
  from?: string;           // Sender ID — defaults to env AFRICASTALKING_SENDER_ID
}

export async function sendSMS({ to, message, from }: SendSMSOptions): Promise<SMSResult> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || 'sandbox';
  const senderId = from || process.env.AFRICASTALKING_SENDER_ID || 'UNISCHEDULE';

  if (!apiKey) {
    console.warn('[SMS] AFRICASTALKING_API_KEY not set — skipping SMS');
    return { success: false, error: 'SMS not configured' };
  }

  const recipients = Array.isArray(to) ? to.join(',') : to;

  try {
    const response = await fetch(
      username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': apiKey,
        },
        body: new URLSearchParams({
          username,
          to: recipients,
          message,
          from: senderId,
        }),
      }
    );

    const data = await response.json();
    const recipient = data?.SMSMessageData?.Recipients?.[0];

    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }

    return { success: false, error: recipient?.status || 'Unknown error' };
  } catch (err) {
    console.error('[SMS] Send failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// Pre-built message templates — bilingual
export const smsTemplates = {
  timetablePublished: (institutionShort: string, semester: string, lang: 'fr' | 'en') =>
    lang === 'fr'
      ? `[${institutionShort}] L'emploi du temps du ${semester} est maintenant disponible. Connectez-vous sur unischedule.africa pour consulter votre planning.`
      : `[${institutionShort}] The ${semester} timetable is now available. Log in at unischedule.africa to view your schedule.`,

  sessionCancelled: (institutionShort: string, courseName: string, day: string, slot: string, lang: 'fr' | 'en') =>
    lang === 'fr'
      ? `[${institutionShort}] Le cours "${courseName}" du ${day} (${slot}) est annulé. Un rattrapage sera planifié. Merci.`
      : `[${institutionShort}] The class "${courseName}" on ${day} (${slot}) is cancelled. A make-up will be scheduled. Thank you.`,

  substituteAssigned: (institutionShort: string, courseName: string, subName: string, day: string, slot: string, room: string, lang: 'fr' | 'en') =>
    lang === 'fr'
      ? `[${institutionShort}] Le cours "${courseName}" du ${day} (${slot}) sera assuré par ${subName} en ${room}. Merci.`
      : `[${institutionShort}] The class "${courseName}" on ${day} (${slot}) will be taught by ${subName} in ${room}. Thank you.`,

  makeupScheduled: (institutionShort: string, courseName: string, day: string, slot: string, room: string, lang: 'fr' | 'en') =>
    lang === 'fr'
      ? `[${institutionShort}] Rattrapage planifié: "${courseName}" le ${day} à ${slot} en ${room}. Merci.`
      : `[${institutionShort}] Make-up class scheduled: "${courseName}" on ${day} at ${slot} in ${room}. Thank you.`,
};
