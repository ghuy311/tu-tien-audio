import { useEffect, useRef } from 'react';

export function useWakeLock(enabled = false) {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        if (!wakeLockRef.current && enabled) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Không thể giữ sáng màn hình WakeLock:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch (err) {
          console.warn('Lỗi giải phóng WakeLock:', err);
        } finally {
          wakeLockRef.current = null;
        }
      }
    };

    if (enabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && isSubscribed) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isSubscribed = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled]);
}
