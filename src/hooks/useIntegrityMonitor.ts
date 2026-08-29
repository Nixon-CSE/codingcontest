import { useEffect, useRef, useState, useCallback } from 'react';
import { ApiService } from '../api';
import { IntegrityEventType, RiskLevel } from '../types';

export interface UseIntegrityMonitorProps {
  isActive: boolean;
  participantId?: string;
  copyPasteRestricted?: boolean;
  fullscreenRequired?: boolean;
  onWarning?: (message: string, violationCount: number, riskLevel: RiskLevel) => void;
}

export function useIntegrityMonitor({
  isActive,
  participantId,
  copyPasteRestricted = true,
  fullscreenRequired = true,
  onWarning,
}: UseIntegrityMonitorProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(document.fullscreenElement));
  const [violationCount, setViolationCount] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('LOW');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const sessionIdRef = useRef<string>(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
  const blurStartTimeRef = useRef<number | null>(null);
  const pendingEventsRef = useRef<IntegrityEventType[]>([]);

  // Throttled event dispatcher
  const reportEvent = useCallback(
    async (eventType: IntegrityEventType, details?: string, durationMs?: number) => {
      if (!isActive || !participantId) return;

      try {
        const res = await ApiService.sendIntegrityEvent(
          eventType,
          participantId,
          details,
          durationMs,
          sessionIdRef.current
        );

        if (res.success) {
          setViolationCount(res.violationCount);
          const newRisk = res.riskLevel as RiskLevel;
          setRiskLevel(newRisk);

          // Trigger warning popup on significant violations
          if (['FULLSCREEN_EXIT', 'VISIBILITY_CHANGE', 'WINDOW_BLUR'].includes(eventType)) {
            let msg = `Integrity Notice (Violation #${res.violationCount}): Contest window focus or fullscreen was lost.`;
            if (newRisk === 'HIGH') {
              msg = `HIGH RISK WARNING (Violation #${res.violationCount}): Multiple integrity violations detected. Your session has been flagged for administrator audit.`;
            } else if (res.violationCount === 1) {
              msg = `Warning (1st Violation): Please maintain focus and fullscreen throughout the contest.`;
            } else if (res.violationCount === 2) {
              msg = `Warning (2nd Violation): Navigating away or exiting fullscreen is recorded in the integrity log.`;
            }

            setWarningMessage(msg);
            if (onWarning) {
              onWarning(msg, res.violationCount, newRisk);
            }
          }
        }
      } catch (err) {
        console.warn('[IntegrityMonitor] Failed to transmit integrity telemetry:', err);
      }
    },
    [isActive, participantId, onWarning]
  );

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        reportEvent('FULLSCREEN_ENTER', 'Participant entered fullscreen mode');
      }
    } catch (err: any) {
      console.warn('Fullscreen request failed or was dismissed:', err.message);
    }
  }, [reportEvent]);

  const dismissWarning = () => {
    setWarningMessage(null);
    if (fullscreenRequired && !document.fullscreenElement) {
      enterFullscreen();
    }
  };

  useEffect(() => {
    if (!isActive) return;

    // 1. Fullscreen change listener
    const handleFullscreenChange = () => {
      const inFull = Boolean(document.fullscreenElement);
      setIsFullscreen(inFull);

      if (!inFull && fullscreenRequired) {
        reportEvent('FULLSCREEN_EXIT', 'Participant exited fullscreen window');
      }
    };

    // 2. Visibility change listener (Tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartTimeRef.current = Date.now();
        reportEvent('VISIBILITY_CHANGE', 'Participant switched browser tab or minimized window');
      } else {
        const duration = blurStartTimeRef.current ? Date.now() - blurStartTimeRef.current : undefined;
        blurStartTimeRef.current = null;
        reportEvent('WINDOW_FOCUS', 'Participant returned to contest tab', duration);
      }
    };

    // 3. Window blur/focus
    const handleWindowBlur = () => {
      if (!blurStartTimeRef.current) {
        blurStartTimeRef.current = Date.now();
        reportEvent('WINDOW_BLUR', 'Contest window lost focus');
      }
    };

    const handleWindowFocus = () => {
      const duration = blurStartTimeRef.current ? Date.now() - blurStartTimeRef.current : undefined;
      blurStartTimeRef.current = null;
      reportEvent('WINDOW_FOCUS', 'Contest window regained focus', duration);
    };

    // 4. Copy / Paste / Cut event detection
    const handleCopy = (e: ClipboardEvent) => {
      if (copyPasteRestricted) {
        reportEvent('COPY_ATTEMPT', 'Copy event triggered');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (copyPasteRestricted) {
        reportEvent('PASTE_ATTEMPT', 'Paste event triggered in workspace');
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (copyPasteRestricted) {
        reportEvent('CUT_ATTEMPT', 'Cut event triggered');
      }
    };

    // 5. Context menu
    const handleContextMenu = (e: MouseEvent) => {
      reportEvent('CONTEXT_MENU', 'Context menu accessed');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    if (copyPasteRestricted) {
      document.addEventListener('copy', handleCopy);
      document.addEventListener('paste', handlePaste);
      document.addEventListener('cut', handleCut);
    }
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive, copyPasteRestricted, fullscreenRequired, reportEvent]);

  return {
    isFullscreen,
    violationCount,
    riskLevel,
    warningMessage,
    dismissWarning,
    enterFullscreen,
  };
}
