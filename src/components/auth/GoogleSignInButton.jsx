import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { api, TokenService } from '../../services/api';
import { isGoogleAuthEnabled } from '../../utils/googleAuth';

/**
 * Renders Google One Tap / button when VITE_GOOGLE_CLIENT_ID is set.
 * On success: stores JWTs and session user, then calls onSignedIn({ user }).
 */
export default function GoogleSignInButton({ onSignedIn, onError, disabled }) {
  const containerRef = useRef(null);
  // GoogleLogin only accepts a fixed pixel width (no responsive/% units), so we
  // measure the container and clamp it — otherwise it overflows narrow phone screens.
  const [width, setWidth] = useState(384);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const measured = entry.contentRect.width;
      if (measured > 0) setWidth(Math.round(Math.min(384, measured)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!isGoogleAuthEnabled()) {
    return null;
  }

  const handleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;
    if (!credential) {
      onError?.(new Error('No credential from Google'));
      return;
    }
    try {
      await api.auth.googleLogin(credential);
      const user = await api.auth.getCurrentUser();
      TokenService.setUser(user);
      onSignedIn?.({ user });
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      aria-busy={disabled}
    >
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.(new Error('Google sign-in was interrupted'))}
        text="continue_with"
        shape="rectangular"
        size="large"
        width={width}
        locale="en"
      />
    </div>
  );
}
