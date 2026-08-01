/**
 * Har kirishda 2FA: foydalanuvchi emailiga yuborilgan 5 xonali kod
 * tasdiqlanmaguncha sessiya "tasdiqlanmagan" hisoblanadi.
 * Belgi sessionStorage'da saqlanadi — brauzer yopilganda o'chadi.
 */
const key = (userId: string) => `farmtrade_otp_ok_${userId}`;

export const markOtpVerified = (userId: string) => {
  try {
    sessionStorage.setItem(key(userId), "1");
  } catch {
    /* ignore */
  }
};

export const isOtpVerified = (userId: string | null | undefined) => {
  if (!userId) return false;
  try {
    return sessionStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
};

export const clearOtpVerified = (userId?: string | null) => {
  try {
    if (userId) sessionStorage.removeItem(key(userId));
    else {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("farmtrade_otp_ok_"))
        .forEach((k) => sessionStorage.removeItem(k));
    }
  } catch {
    /* ignore */
  }
};
