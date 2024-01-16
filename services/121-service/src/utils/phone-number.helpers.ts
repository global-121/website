/**
 * Format a phone number for use with Twilio as an international phone number
 *
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number, including "+"-prefix (unless empty or only-non-numeric input)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Strip all (possibly existing) prefixes
  const onlyNumbers = phoneNumber.replace(/\D/g, '');
  // If result is empty, then do not add a "+"-prefix
  if (!onlyNumbers) {
    return onlyNumbers;
  }
  return '+' + onlyNumbers;
}

/**
 * Format a (WhatsApp-)phone number for use with Twilio as WhatsApp-account
 *
 * @param phoneNumber - The phone number to format
 * @returns The formatted phone number, including "whatsapp:+"-prefix
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  const phoneNumberWithPlus = formatPhoneNumber(phoneNumber);

  // Return in the format Twilio expects
  return 'whatsapp:' + phoneNumberWithPlus;
}
