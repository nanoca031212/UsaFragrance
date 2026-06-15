import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackEvent, setGlobalUserData } from '@/lib/utils';

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_1 || '1201843863809192';

export const usePixel = (trackPageView = false) => {
  const router = useRouter();

  useEffect(() => {
    if (!trackPageView) return;

    if (window.location.pathname === '/') {
      if ((window as any).fbq) {
        (window as any).fbq('track', 'PageView');
      }

      if (!sessionStorage.getItem('home_event_fired')) {
        trackEvent('Home', undefined, undefined, false);
        sessionStorage.setItem('home_event_fired', '1');
      }
    }
  }, [router.events, trackPageView]);

  return {
    // Função para atualizar dados do usuário para Advanced Matching
    setUserData: (userData: Record<string, string>) => {
      // Atualizar dados globais para CAPI
      setGlobalUserData(userData);

      // Facebook Advanced Matching
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('init', FB_PIXEL_ID, userData);
      }
      
      // TikTok Identify
      if (typeof window !== 'undefined' && (window as any).ttq) {
        (window as any).ttq.identify({
          email: userData.em,
          phone_number: userData.ph,
          name: userData.fn // TikTok usa 'name' ou separar first/last dependendo da config, mas identify genérico ajuda
        });
      }
    },
    addToCart: (params = {}, options = {}) => trackEvent('AddToCart', params, options),
    initiateCheckout: (params = {}, options = {}) => trackEvent('InitiateCheckout', params, options),
    viewContent: (params = {}, options = {}) => trackEvent('ViewContent', params, options),
    purchase: (params = {}, options = {}) => trackEvent('Purchase', params, options),
    // Wrapper genérico para eventos customizados
    track: (event: string, params = {}, options = {}) => trackEvent(event, params, options)
  };
};

export default usePixel;